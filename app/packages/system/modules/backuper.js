import moment from 'moment';
import pathUtil from 'path';
import pathAlias from 'path-alias';
import fs from 'fs';
import childProcess from 'child_process';

import FromArchiveCreator from '../../../modules/instanceManager/components/creator/fromArchive';
import Compressor from './backuper/compressor';
import AWSS3 from './backuper/awsS3';
import DbBackuper from './backuper/dbBackuper';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

const wrapperConfig = wrapperRegistry.getConfig();
const bucketName = wrapperConfig.backup.bucket;
const tmpFolder = pathUtil.resolve('runtime/backups');


export default class Backuper {
//	Backup system-related tables and files, e.g. wrapper DB, delivery Db, etc.
	constructor() {
		this.preparePath = this.preparePath.bind(this);
	}

	async systemBackup(path = '') {
		return this.baseBackup(
			[
				wrapperConfig.db.name,
				wrapperConfig.instanceManager.db.sample,
				wrapperConfig.packages.delivery.deliveryDb.name
			],
			this.getSystemArchiveName(path),
			path
		);
	}

	async backup(instanceRegistry, path = '') {
		return this.baseBackup(
			[instanceRegistry.getConfig().db.name],
			this.getArchiveName(path, instanceRegistry.getInstanceInfo()),
			path
		);
	}

	async baseBackup(databases, archiveName, path = '') {
		path = this.preparePath(path);

		const dbBackups = [];
		await this.setup();
		for (const database of databases) {
			const dbBackup = new DbBackuper();
			dbBackups.push(dbBackup);

			await dbBackup.makeDump(database, path);
		}

		const files = dbBackups.map(dbBackup => dbBackup.getDumpPath());
		const archive = await new Compressor().compress(files, archiveName);

		for (const dbBackup of dbBackups) {
			await dbBackup.removeDump();
		}

		return archive;
	}

	async setup() {
		try {
			await fs.promises.mkdir(tmpFolder);
		} catch (err) {
			if (err.code !== 'EEXIST') throw err;
		}
	}

	preparePath(path) {
		if (!path) {
			return tmpFolder;
		}

		if (!pathUtil.isAbsolute(path)) {
			return pathUtil.resolve(pathAlias.getRoot(), path);
		}

		return path;
	}

	getSystemArchiveName(path) {
		let out = `${path || tmpFolder}/system_`;
		out += moment().format(this.getTimeFormat());
		out += '.tar.gz';

		return out;
	}

	getArchiveName(path, instanceInfo) {
		let out = `${path || tmpFolder}/i${instanceInfo.instance_id}-`;
		out += moment().format(this.getTimeFormat());
		out += '.tar.gz';

		return out;
	}

	getTimeFormat() {
		return 'YYYYMMDD-HHmm';
	}

	getInstanceFilesToCompress(instanceRegistry) {
		const instanceRoot = instanceRegistry.getInstancePath();

		return [
			`${instanceRoot}/config.coffee`,
			`${instanceRoot}/home`
		];
	}

	restore(file, clientId) {
		let creator = null;

		return wrapperRegistry.getDb().sql('\
select \
client_email \
from \
instance \
where \
client_id = :client \
limit 1\
', {
			client : clientId
		})
		.then(rows => {
			if (!rows.length) {
				throw new Error(`Instance with clientId='${clientId}' not found.`);
			}

			const backupMeta = this.parseFileName(file);
			creator = new FromArchiveCreator(file, clientId, rows[0].client_email, backupMeta);
			return creator.create();
	})/*.then(() => {
			const indexer = new Indexer({sphinxSuffix: 'Ru'});
			return indexer.indexNewInstances([creator]);
		})*/
		.then(() => {
			console.log(creator.getInstance().toJSON());
		});
	}

	async backupToAWS(instanceRegistry, path = null) {
		return this.baseBackupToAws(() => this.backup(instanceRegistry, path));
	}

	async backupSystemToAWS(path = null) {
		return this.baseBackupToAws(() => this.systemBackup(path));
	}

	async baseBackupToAws(pathToArchiveGetter) {
		let pathToArchive = null;
		try {
			pathToArchive = await pathToArchiveGetter();
			const awsS3 = new AWSS3();
			await awsS3.uploadFile(wrapperRegistry.getConfig().backup.bucket, pathToArchive);
		} finally {
			if (pathToArchive) {
				await this.removeFile(pathToArchive);
			}
		}
	}

	async removeFile(filePath) {
		try {
			await fs.promises.access(filePath);
		} catch (e) {
			return console.error(e);
		}

		const cmd = `${wrapperConfig.instanceManager.rmCmd} ${filePath}`;
		return new Promise((resolve, reject) =>
			childProcess.exec(cmd, (err, data) => err ? reject(err) : resolve(data))
		);
	}

	async deleteOutdatedAWS() {
		const awsS3 = new AWSS3();
		const {bucket} = wrapperRegistry.getConfig().backup;

		const files = await awsS3.getFiles(bucket);
		const toDelete = this.getOutdatedFiles(files.Contents);

		if (toDelete.length > 0) {
			return awsS3.deleteFiles(bucket, toDelete);
		}
	}

	getBucketInfo() {
		const awsS3 = new AWSS3();

		const total = {
			size: 0,
			files: 0
		};

		return awsS3.getFiles(bucketName)
		.then(result => {
			const groupedByInstances = this.groupByInstances(result.Contents);
			for (let instanceId in groupedByInstances) {
				const data = groupedByInstances[instanceId];
				let instanceSize = 0;
				data.files.forEach(row => instanceSize += row.size);

				data.totalSize = instanceSize;
				total.size += instanceSize;
				total.files += data.files.length;
			}

			return {
				total,
				instances: groupedByInstances
			};
	});
	}

	getOutdatedFiles(files) {
		const toDelete = [];
		const addToDelete = filePath => toDelete.push({Key: filePath});

		const {expire, storeAmount} = wrapperRegistry.getConfig().backup;
		const expireDate = moment().subtract(expire, 'days');

		const groupedByInstances = this.groupByInstances(files);
		for (let instanceId in groupedByInstances) {
			groupedByInstances[instanceId].files
				.sort(this.filesSorterNewestFirst)
				.forEach((row, i) => {
					if (i >= storeAmount || row.ts.isBefore(expireDate)) return addToDelete(row.path);
				});
		}

		return toDelete;
	}

	filesSorterNewestFirst(a, b) {
		if (a.ts.isSame(b.ts)) {
			return 0;
		}

		if (a.ts.isBefore(b.ts)) {
			return 1;
		} else {
			return -1;
		}
	}

	groupByInstances(files) {
		const groupedByInstances = {};
		for (let file of Array.from(files)) {
			const backupMeta = this.parseFileName(file.Key);

			if (!backupMeta) {
				continue;
			}

			if (!groupedByInstances[backupMeta.instanceId]) {
				groupedByInstances[backupMeta.instanceId] = {
					files: []
				};
			}

			groupedByInstances[backupMeta.instanceId].files.push({
				ts: backupMeta.ts,
				path: file.Key,
				size: Number(file.Size)
			});
		}

		return groupedByInstances;
	}

	parseFileName(fileName) {
		let res = fileName.match(/system_(\d{8})-(\d{4})\.tar\.gz$/);
		if (res) {
			return {
				instanceId: 'system',
				ts: moment(`${res[1]}-${res[2]}`, this.getTimeFormat())
			};
		}

		res = fileName.match(/i(\d+)-(\d{8})-(\d{4})\.tar\.gz$/);
		if (!res) {
			return false;
		}

		return {
			instanceId: res[1],
			ts: moment(`${res[2]}-${res[3]}`, this.getTimeFormat())
		};
	}

	listBackupsAWS(instanceId) {
		const awsS3 = new AWSS3();
		const {
            bucket
        } = wrapperRegistry.getConfig().backup;

		return awsS3.getFiles(bucket)
		.then(files => {
			files = files.Contents.reduce((acc, file) => {
				const info = this.parseFileName(file.Key);

				if (info && (info.instanceId === instanceId)) {
					acc.push(file.Key);
				}

				return acc;
			}
			, []);

			return files;
		});
	}

	restoreFromS3(file, client) {
		const awsS3 = new AWSS3();
		const {
            bucket
        } = wrapperRegistry.getConfig().backup;

		return awsS3.downloadFile(bucket, file)
		.then(filePath => {
			return this.restore(filePath, client);
		});
	}

	downloadFromS3(file) {
		const awsS3 = new AWSS3();
		const {
            bucket
        } = wrapperRegistry.getConfig().backup;

		return awsS3.downloadFile(bucket, file)
		.then(filePath => {
			return filePath;
		});
	}
}