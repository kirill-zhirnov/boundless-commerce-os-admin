import BasicCommand from '../../../modules/commands/basic';
import Backuper from '../modules/backuper';
import diskspace from 'diskspace';
import format from 'format-io';
import * as instances from '../../../modules/instances';
import {bootstrapInstanceById} from '../../../modules/bootstrap/instance';

export default class BackupCommand extends BasicCommand {
	// actionCreate() {
	// 	const instanceId = this.getOption('instance');
	// 	if (!instanceId) {
	// 		throw new Error('You should pass instance id: --instance=<id>');
	// 	}
	//
	// 	return wrapperBootstrap('bootstrapInstance', instanceId)
	// 	.then(() => {
	// 		const registry = instanceRegistry.getRegistryByInstance(instanceId);
	//
	// 		const backuper = new Backuper();
	// 		return backuper.backup(registry, this.getOption('path'));
	// 	});
	// }

	actionRestoreFromArchive() {
		const file = this.getOption('file');
		const client = this.getOption('client');

		if (!file || !client) {
			throw new Error('You should pass path to archive file and client id!');
		}

		const backuper = new Backuper();
		return backuper.restore(file, client);
	}

	async actionS3Service() {
		const backuper = new Backuper();

		const result = await new Promise((resolve, reject) =>
			diskspace.check('/', (err, data) => err ? reject(err) : resolve(data))
		);
		const freeGB = result.free / (1000 * 1000 * 1000);
		if (freeGB < 10) {
			throw new Error(`Not enough space for making backups. Free space: ${freeGB}GB.`);
		}

		const data = await instances.loadCachedData();
		const runBackup = async (runner, method, instance) => {
			try {
				await runner();
			} catch (e) {
				console.error(`Error making backup, method: '${method}', instance: '${instance}':`, e);
			}
		};

		await runBackup(() => backuper.backupSystemToAWS(), 'backupSystemToAWS', 'system');
		for (let key in data.instances) {
			const val = data.instances[key];
			await runBackup(async () => {
				const registry = await bootstrapInstanceById(val.instance_id, false);
				await backuper.backupToAWS(registry);
			}, 'backupToAWS', val.instance_id);
		}

		await backuper.deleteOutdatedAWS();
		console.log('ended!');
	}

	actionS3List() {
		const instance = this.getOption('instance');
		if (!instance) {
			throw new Error('You should pass instance id as --instance=<ID>');
		}

		const backuper = new Backuper();
		return backuper.listBackupsAWS(instance)
		.then(backups => {
			let message;
			if (backups.length > 0) {
				message = `Backups of instance №${instance} in S3 bucket:`;
			} else {
				message = `There are no backups of instance №${instance} in S3 bucket`;
			}

			console.log(message);

			for (let file of Array.from(backups)) {
				console.log(file);
			}

		});
	}

	actionRestoreFromS3() {
		const file = this.getOption('file');
		const client = this.getOption('client');

		if (!file || !client) {
			throw new Error('You should pass file and client options!');
		}

		const backuper = new Backuper();
		return backuper.restoreFromS3(file, client);
	}

	actionDownloadFromS3() {
		const file = this.getOption('file');

		if (!file) {
			throw new Error('You should pass file option!');
		}

		const backuper = new Backuper();
		return backuper.downloadFromS3(file)
		.then(function(filePath) {
			console.log('Downloaded to:', filePath);
		});
	}

	actionBucketInfo() {
		const backuper = new Backuper();
		return backuper.getBucketInfo()
		.then(info => {
			for (let instanceId in info.instances) {
				const data = info.instances[instanceId];
				console.log(`Instance - #${instanceId} files: ${data.files.length}, size: ${format.size(data.totalSize)}`);
			}

			return console.log(`Total bucket size: ${format.size(info.total.size)}, files: ${info.total.files}`);
		});
	}

	// actionTest() {
	// 	const deferred = Q.defer();
	//
	// 	const instanceId = this.getOption('instance');
	// 	if (!instanceId) {
	// 		throw new Error('You should pass instance id: --instance=<id>');
	// 	}
	//
	// 	wrapperBootstrap('bootstrapInstance', instanceId)
	// 	.then(() => {
	// 		const registry = instanceRegistry.getRegistryByInstance(instanceId);
	//
	// 		const backuper = new Backuper();
	// 		return backuper.backupToAWS(registry, this.getOption('path'));
	// }).then(() => {
	// 		return deferred.resolve();
	// 	}).done();
	//
	// 	return deferred.promise;
	// }
}