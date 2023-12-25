// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import Applier from './applier';
import Sequelize from '../../db/sequelize';
const Q = require('q');
const pathAlias = require('path-alias');
const serverUtils = require('../../utils/server');
const fs = require('fs');
const {wrapperRegistry} = require('../../../modules/registry/server/classes/wrapper');
const wrapperConfig = wrapperRegistry.getConfig();

export default class InstanceApplier extends Applier {
	constructor(instanceRegistry, tsFrom) {
		// @ts-ignore
		super(...arguments);
		this.instanceRegistry = instanceRegistry;
		this.tsFrom = tsFrom;

		this.migrationsForAppy = [];
	}

	applyMigrations() {
		return serverUtils.runFlow(this, [
			'setupInstanceDb',
			'detectMigrationsForApply',
			'execMigrations',
			'closeInstanceDb'
		]);
	}

	setupInstanceDb() {
		this.instanceDb = new Sequelize(this.instanceRegistry.getConfig().db.name, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config);
		return this.turnOnLogging(this.instanceDb);
	}

	closeInstanceDb() {
		return this.instanceDb.close();
	}

	detectMigrationsForApply() {
		return this.db.sql('\
select \
* \
from \
migration \
where \
ts > to_timestamp(:tsFrom, :format) \
order by \
version asc\
', {
			format: 'YYYY-MM-DD HH24:MI',
			tsFrom: this.tsFrom
		})
		.then(rows => {
			for (let row of Array.from(rows)) {
				if (fs.existsSync(pathAlias.resolve(`migrations/${row.version}.coffee`))) {
					this.migrationsForAppy.push(row.version);
				}
			}

		});
	}

	execMigration(migration) {
		if (!migration.shallApplyToInstances()) {
			return Q();
		}

		console.log('Migration started', migration.getVersion());

		return Q(migration.up(this.instanceDb, 'instance', this.instanceRegistry))
		.then(() => {
			console.log('Migration completed');
		});
	}

	markMigrationAsCompleted() {
		return Q();
	}
}