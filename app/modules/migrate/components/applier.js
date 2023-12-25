import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import fs from 'fs';
import path from 'path';
import serverUtils from '../../utils/server';
import {loadCachedData} from '../../instances';
// import instanceRegistry from '../../registry/server/classes/instance';
import Sequelize from '../../db/sequelize';
import {bootstrapInstanceById} from '../../bootstrap/instance';
import * as samples from '../../instanceManager/components/sample';

export default class Applier {
	constructor() {
		this.db = wrapperRegistry.getDb();
		this.migrationsForAppy = [];

		// whether or not instances were changed
		this.instancesAffectected = false;
	}

	applyMigrations() {
		return serverUtils.runFlow(this, [
			'readMigrationsInFS',
			'checkTableExists',
			'detectMigrationsForApply',
			'execMigrations',
			'reCreateSamples'
		]);
	}

	//	re-create instance samples only if instances were affected:
	async reCreateSamples() {
		if (!this.instancesAffectected) {
			return;
		}

		console.log('Samples re-create started\n');
		await samples.reCreate();
		console.log('Samples were re-created\n');
	}

	async execMigrations() {
		for (const version of this.migrationsForAppy) {
			const migrationPath = path.join(__dirname, `../../../../migrations/${version}.js`);
			const Migration = require(migrationPath).default;
			const migration = new Migration;
			migration.setVersion(version);

			await this.execMigration(migration);
			await this.markMigrationAsCompleted(version);
		}
	}

	markMigrationAsCompleted(version) {
		return this.db.sql('\
insert into migration \
(version) \
values \
(:version)\
', {
			version
		});
	}

	async execMigration(migration) {
		if (migration.shallApplyToWrapper()) {
			//			run migration for sample wrapper:
			this.turnOnLogging(this.db);
			console.log(`Migration started for wrapper, ${migration.getVersion()}\n`);
			await migration.up(this.db, 'wrapper', null);
			console.log('Migration completed for wrapper\n');
		}

		if (migration.shallApplyToSample()) {
			const config = wrapperRegistry.getConfig();
			const sampleDb = new Sequelize(config.instanceManager.db.sample, config.db.user, config.db.pass, config.db.config);

			this.turnOnLogging(sampleDb);

			console.log('Migration started for sample\n');
			await migration.up(sampleDb, 'sample', null);
			console.log('Migration completed for sample\n');

			await sampleDb.close();
		}

		if (!migration.shallApplyToInstances()) return;

		this.instancesAffectected = true;
		const data = await loadCachedData();
		for (const instanceId of Object.keys(data.instances)) {
			// const registry = instanceRegistry.getRegistryByInstance(instanceId);
			const instanceRegistry = await bootstrapInstanceById(Number(instanceId), true, true);

			const wrapperConfig = wrapperRegistry.getConfig();
			const instanceConfig = instanceRegistry.getConfig();

			// connect with wrapper user and pass, since wrapper is owner of all tables in postgres
			const instanceDb = new Sequelize(instanceConfig.db.name, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config);

			this.turnOnLogging(instanceDb);

			console.log(`Migration started for instance - ${instanceRegistry.getInstanceInfo().instance_id}\n`);
			await migration.up(instanceDb, 'instance', instanceRegistry);
			await instanceDb.close();
			console.log(`Migration ended for instance - ${instanceRegistry.getInstanceInfo().instance_id}\n`);
		}
	}

	async detectMigrationsForApply() {
		const rows = await this.db.sql('\
select * from migration\
');
		for (const row of Array.from(rows)) {
			//@ts-ignore
			const pos = this.migrationsForAppy.indexOf(row.version);

			if (pos !== -1) {
				this.migrationsForAppy.splice(pos, 1);
			}
		}
	}

	async readMigrationsInFS() {
		const list = await fs.readdirSync(path.join(__dirname, '../../../../migrations'));

		this.migrationsForAppy = [];

		for (const fileName of Array.from(list)) {
			if (/^\./.test(fileName)) {
				continue;
			}

			const exists = fs.existsSync(path.join(__dirname, `../../../../migrations/${fileName}`));

			if (exists) {
				const migrationName = path.basename(fileName, path.extname(fileName));
				this.migrationsForAppy.push(migrationName);
			}
		}
	}

	checkTableExists() {
		return this.db.sql('\
create table if not exists migration ( \
version varchar(255) primary key, \
ts timestamp with time zone not null default now() \
)\
'
		);
	}

	turnOnLogging(db) {
		return db.options.logging = console.log;
	}
}