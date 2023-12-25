// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import Creator from '../creator';
import Compressor from '../../../../packages/system/modules/backuper/compressor.js';
import InstanceApplier from '../../../migrate/components/instanceApplier';
const Q = require('q');
const utils = require('../../../utils/server');
const fs = require('fs');
const pathUtil = require('path');
const childProcess = require('child_process');
const _ = require('underscore');

export default class FromArchiveCreator extends Creator {
	constructor(archivePath, clientId, clientEmail, backupMeta) {
		// @ts-ignore
		super(...arguments);
		this.archivePath = archivePath;
		this.clientId = clientId;
		this.clientEmail = clientEmail;
		this.backupMeta = backupMeta;

		this.extractedInPath = null;
		this.dbDumpPath = null;
	}

	create() {
		return utils.runFlow(this, [
			'extractArchive',
			'createInstance',
			'createFolder',
			'setupHosts',
			'createInstanceConfig',
			'setupDb',
			'copyFiles',
			'setAccessRights',
			'bootstrapInstance',
//			'setupSphinxPrefix',
			'setupRobotsTxt',
			'createNginxConfig',
			'applyMigrations',
			'bindToClient',
			'triggerCreated',
			'removeExtracted'
		]);
	}

	removeExtracted() {
		if (this.config.instanceManager.rmCmd) {
			return Q.nfcall(childProcess.exec, `${this.config.instanceManager.rmCmd} ${this.extractedInPath}`);
		}
	}

	applyMigrations() {
		const applier = new InstanceApplier(this.instanceRegistry, this.backupMeta.ts.format('YYYY-MM-DD HH:mm'));

		return applier.applyMigrations();
	}

	bindToClient() {
		return this.instance.changeStatus({
			status : 'available',
			client_id : this.clientId,
			client_email: this.clientEmail
		});
	}

	copyFiles() {
		const files = {};
		// media files
		files[`${this.extractedInPath}/home`] = `${this.instanceRoot}/home`;

		return this.processCopyFiles(files);
	}

	extractArchive() {
		const deferred = Q.defer();

		const compressor = new Compressor();
		compressor.uncompress(this.archivePath)
		.then(res => {
			this.extractedInPath = res;

			return Q.nfcall(fs.readdir, this.extractedInPath, {encoding:'utf8'});
	})
		.then(filesList => {
			for (let fileName of Array.from(filesList)) {
				if (pathUtil.extname(fileName) === '.sql') {
					this.dbDumpPath = `${this.extractedInPath}/${fileName}`;
					break;
				}
			}

			if (!this.dbDumpPath) {
				throw new Error(`Cannot find dump file in: ${this.extractedInPath}.`);
			}

			return deferred.resolve();
	});

		return deferred.promise;
	}

	createDb() {
		const deferred = Q.defer();

		this.db.sql(`\
CREATE DATABASE ${this.instanceConfig.db.name} OWNER ${this.instanceConfig.db.user}\
`).then(() => {
			let cmd = this.config.backup.cmd.psql;
			cmd += ` -U ${this.config.db.user} -h ${this.config.instanceDb.config.host} ${this.instanceConfig.db.name} < ${this.dbDumpPath}`;
			return Q.nfcall(childProcess.exec, cmd);
	}).then(() => {
			this.connectToInstanceDb();

			return this.dropExistingMappings();
		}).then(() => {
//			The connection will be re-connected in parent class
			return this.instanceDb.close();
		}).then(() => {
			return deferred.resolve();
		});

		return deferred.promise;
	}

	dropExistingMappings() {
		const deferred = Q.defer();

		this.instanceDb.sql('select * from pg_user_mappings where srvname = \'delivery_server\'')
		.then(rows => {
			rows = rows.filter(row => {
				return !_.contains([this.config.db.user, 'postgres'], row.usename);
			});

			let f = Q();
			for (let row of Array.from(rows)) {
				(row => {
					return f = f.then(() => {
						return this.instanceDb.sql(`\
drop user mapping if exists for ${row.usename} server delivery_server\
`
						);
					});
				})(row);
			}

			return f;
	}).then(() => {
			return deferred.resolve();
		}).done();

		return deferred.promise;
	}
}