import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import utils from '../../../utils/server';
import fs from 'fs';
import mkdirp from 'mkdirp';
import chmodr from 'chmodr';
import Sequelize from '../../../db/sequelize';
import _ from 'underscore';
import childProcess from 'child_process';
import {bootstrapInstanceById} from '../../../bootstrap/instance';

export default class SampleCreator {
	constructor(instanceId, alias) {
		this.alias = alias;
		if (!instanceId || !this.alias) {
			throw new Error('You must pass instanceId and alias.');
		}

		if (!/^[a-z0-9_]{3,}$/.test(this.alias)) {
			throw new Error(`Alias can be only a-z. Got: ${this.alias}`);
		}

		const wrapperConfig = wrapperRegistry.getConfig();
		this.instance = {
			id: instanceId,
			dbName: `i${instanceId}`,
			dbUserName: `i${instanceId}`,
			path: `${wrapperConfig.instancesPath}/i${instanceId}`,
			registry: null,
			db: null
		};

		this.sample = {
			alias: this.alias,
			dbName: `sample_${this.alias}`,
			path: `${wrapperConfig.instanceManager.samplesPath}/${this.alias}`,
			db: null
		};

		this.db = wrapperRegistry.getDb();
	}

	create() {
		return utils.runFlow(this, [
			'prepareInstance',
			'copyDb',
			'prepareSampleDb',
			// 'copyFiles',
			'closeDbConnections',
			'markAvailable'
		]);
	}

	async prepareInstance() {
		// const instanceBootstrapper = await wrapperBootstrapper('bootstrapInstance', this.instance.id, 'runDb');
		this.instance.registry = await bootstrapInstanceById(this.instance.id);
		this.instance.db = this.instance.registry.getDb();
	}

	markAvailable() {
		return this.db.sql(`
			update sample set status = 'available' where alias = :alias
		`, {
			alias: this.sample.alias
		});
	}

	//пропустил на время - нужно поправить будет
	// async copyFiles() {
	// 	await this.initFolders();
	// 	const files = {};
	// 	files[`${this.instance.path}/home`] = `${this.sample.path}/home`;
	//
	// 	for (const from in files) {
	// 		const to = files[from];
	// 		await ncp(from, to);
	// 	}
	// }

	async copyDb() {
		await this.db.sql(`
			insert into sample
				(alias, status, from_instance_id)
			values
				(:alias, :status, :instance)
			on conflict (alias)
			do update
			set
				status = :status,
				from_instance_id = :instance
		`, {
			alias: this.sample.alias,
			status: 'unavailable',
			instance: this.instance.id
		});
		await this.db.sql(`drop database if exists ${this.sample.dbName}`);
		await this.db.sql(`
			SELECT
				pg_terminate_backend(pg_stat_activity.pid)
			FROM
				pg_stat_activity
			WHERE
				pg_stat_activity.datname = :dbName
				AND pid <> pg_backend_pid()
		`, {
			dbName: this.instance.dbName
		});

		await this.db.sql(`
			create database ${this.sample.dbName} with template ${this.instance.dbName}
		`);
	}

	async prepareSampleDb() {
		const wrapperConfig = wrapperRegistry.getConfig();
		this.sample.db = new Sequelize(this.sample.dbName, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config);

		await this.sample.db.sql(`revoke all on all tables in schema public from ${this.instance.dbUserName}`);
		await this.sample.db.sql(`revoke all on all sequences in schema public from ${this.instance.dbUserName}`);
		const tblsToClean = [
			{
				sql: `
					delete from
						inventory_movement
					where
						reserve_id is not null
						or person_id in (
							select person_id from person where is_owner is false
						)
				`
			},
			'reserve',
			'orders',
			'basket',
			'admin_comment',
			{
				sql: 'delete from person where is_owner is false'
			},
			{
				sql: 'update person_settings set settings = :settings',
				params: {
					settings: JSON.stringify({
						showSwitcherBar: true
					})
				}
			},
			'delivery',
			{
				sql: 'update setting set value = \'[]\' where setting_group = \'system\' and key = \'cleanUp\''
			},
			{
				sql: 'delete from api_token'
			}
		];

		for (const tbl of Array.from(tblsToClean)) {
			if (_.isString(tbl)) {
				await this.sample.db.sql(`delete from ${tbl}`);
			} else {
				await this.sample.db.sql(tbl.sql, tbl.params);
			}
		}

		await this.sample.db.sql(`
			update person set email = 'info@sellios.ru' where is_owner is true
		`);

		const [row] = await this.sample.db.sql('select count(*) as total from product');
		if (row.total == 0) {
			await this.sample.db.sql(`
				update
					setting
				set
					value = ?
				where
					setting_group = 'system'
					and key = 'cleanUp'
			`, [JSON.stringify([new Date()])]);
		}

		await this.sample.db.sql(`drop user mapping if exists for ${this.instance.dbUserName} server delivery_server`);
	}

	async initFolders() {
		await this.removeFile(this.sample.path);
		await this.initSamplesFolder();
	}

	async removeFile(filePath) {
		if (!fs.existsSync(filePath)) {
			return;
		}

		const wrapperConfig = wrapperRegistry.getConfig();
		const cmd = `${wrapperConfig.instanceManager.rmCmd} ${filePath}`;
		await childProcess.exec(cmd);
	}

	async initSamplesFolder() {
		const wrapperConfig = wrapperRegistry.getConfig();

		const folders = [
			wrapperConfig.instanceManager.samplesPath,
			this.sample.path,
			`${this.sample.path}/home`
		];

		for (const folderPath of Array.from(folders)) {
			if (fs.existsSync(folderPath)) {
				return;
			}

			await mkdirp(folderPath);
			await chmodr(folderPath, 0o775);
		}
	}

	async closeDbConnections() {
		await this.instance.db.close();
		await this.sample.db.close();
	}
}