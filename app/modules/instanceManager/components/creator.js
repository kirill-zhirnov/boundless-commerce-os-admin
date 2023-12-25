//@ts-nocheck

import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import ExtendedSequelize from '../../db/sequelize';
import * as instances from '../../instances';
import {bootstrapInstanceById} from '../../bootstrap/instance';
import RobotsGenerator from '../../../packages/system/modules/robotsGenerator';
// import childProcess from 'child_process';
import {ncp} from 'ncp';
import pathAlias from 'path-alias';
import mkdirp from 'mkdirp';
import chmodr from 'chmodr';
import awsRoute53 from '../components/awsRoute53';
import randomString from 'random-string';
import _ from 'underscore';
// import replace from 'frep';
import fs from 'fs';
import {promisify} from 'util';
import path from 'path';
import InstanceS3Storage from '../../s3Storage/instance';
import {getImgType} from '../../../packages/cms/modules/img';

const readdir = promisify(fs.readdir);

// let ThemeInstaller = pathAlias('@p-theme/modules/themeInstaller');
// const InstanceBootstrapper = pathAlias('@modules/bootstrap/instance');
// const layoutCreator = pathAlias('@p-cms/modules/layoutCreator');

// const typeareaToTpl = pathAlias('@p-cms/modules/typeareaToTpl');

export default class Creator {
	constructor() {
		this.db = wrapperRegistry.getDb();
		this.config = wrapperRegistry.getConfig();

		/**
		 * @type {IInstanceModel}
		 */
		this.instance = null;
		this.instanceRoot = null;
		this.host = null;
		this.staticHost = null;

		this.sampleDb = this.config.instanceManager.db.sample;

		//		connection to db
		this.instanceDb = null;
		this.instanceConfig = {};
		this.instanceRegistry = null;

		/**
		 * @type {null|InstanceS3Storage}
		 */
		this.s3Storage = null;

		this.setupS3DemoFiles = true;
	}

	async create() {
		await this.createInstance();
		await this.createFolder();
		await this.setupHosts();
		await this.createInstanceConfig();
		await this.setupDb();
		await this.bootstrapInstance();

		if (this.setupS3DemoFiles) {
			await this.copyS3Files();
		}

		await this.setupRobotsTxt();
		await this.markAsCreated();
		await this.triggerCreated();
	}

	async createInstance() {
		/**
		 * @type {IInstanceStatic}
		 */
		const Instance = this.db.model('instance');
		this.instance = await Instance.createInstance();
	}

	async createInstanceConfig() {
		this.instanceConfig = {
			db: {
				name: `i${this.instance.instance_id}`,
				user: `i${this.instance.instance_id}`,
				pass: randomString({
					length: 7,
					numeric: true,
					letters: true,
					special: false
				}),
				config: this.config.db.config
			},

			staticServer: {
				protocol: this.config.instanceManager.useHttps ? 'https' : 'http',
				host: `${this.staticHost.host}`,
				imageSalt: this.config.instanceManager.nginx.staticServer.imageSalt,
				resizeAccessKey: this.config.instanceManager.nginx.staticServer.resizeAccessKey
			},

			auth: {
				salt: randomString({
					length: 5,
					numeric: true,
					letters: true,
					special: false
				})
			}
		};

		this.instance.config = this.instanceConfig;
		await this.instance.save();
	}

	async createFolder() {
		this.instance.path = `i${this.instance.instance_id}`;
		await this.instance.save();

		//legacy
		this.instanceRoot = `${wrapperRegistry.getConfig().instancesPath}/${this.instance.path}`;
		// await this.makeFolders([]);
	}

	async setAccessRights() {
		const folders = [
			'runtime'
		];

		for (let item of folders) {
			await promisify(chmodr)(`${this.instanceRoot}/${item}`, 0o775);
		}
	}

	async setupHosts() {
		this.host = await this.createHost(`i${this.instance.instance_id}.${this.config.instanceManager.hostForSubDomains}`, 'system', true);
		this.staticHost = await this.createHost(`i${this.instance.instance_id}-static.${this.config.instanceManager.hostForSubDomains}`, 'static', true);

		const hosts = [this.host.host, this.staticHost.host];
		if (this.config.instanceManager.setupDnsZone) {
			await awsRoute53.createARecords(hosts);
		}

		// const folders = [];
		// for (let host of Array.from(hosts)) {
		// 	folders.push(`runtime/nginx/logs/${host}`);
		// }
		//
		// return this.makeFolders(folders);
	}

	async createHost(host, type, createDnsRecord = true) {
		const props = {
			host,
			type,
			instance_id: this.instance.instance_id,
			our_dns_records: createDnsRecord
		};

		//@ts-ignore
		return await this.db.model('host').build().set(props).save();
	}

	async setupDb() {
		await this.createDbUser();
		await this.createDb();

		this.connectToInstanceDb();

		await this.instanceDb.sql(`grant all privileges on all tables in schema public to ${this.instanceConfig.db.user}`);
		await this.instanceDb.sql(`grant all privileges on all sequences in schema public to ${this.instanceConfig.db.user}`);

		await this.instanceDb.sql(`alter table vw_delivery_city owner to ${this.instanceConfig.db.user}`);
		await this.instanceDb.sql(`alter table vw_delivery_country owner to ${this.instanceConfig.db.user}`);

		const deliveryViewConf = wrapperRegistry.getConfig().deliveryViewDb;
		await this.instanceDb.sql(`create user mapping for ${this.instanceConfig.db.user} server delivery_server options (user :user, password :pass)`, {
			user: deliveryViewConf.user,
			pass: deliveryViewConf.pass
		});

		await this.instanceDb.sql(`
			update
				site
			set
				host = :host,
				aliases = :aliases,
				system_host = :host
		`, {
			host: this.host.host,
			aliases: `["${this.staticHost.host}"]`
		});
	}

	connectToInstanceDb() {
		this.instanceDb = new ExtendedSequelize(
			this.instanceConfig.db.name,
			this.config.db.user,
			this.config.db.pass,
			ExtendedSequelize.getConstructOptions(this.config.instanceDb.config)
		);
	}

	createDbUser() {
		return this.db.sql(`CREATE USER ${this.instanceConfig.db.user} WITH PASSWORD :pass`, {
			pass: this.instanceConfig.db.pass
		});
	}

	createDb() {
		return this.db.sql(`CREATE DATABASE ${this.instanceConfig.db.name} WITH TEMPLATE ${this.sampleDb} OWNER ${this.instanceConfig.db.user}`);
	}

	// async copyFiles() {
	// 	const files = {};
	// 	// media files
	// 	files[pathAlias.resolve('@modules/instanceManager/samples/media')] = `${this.instanceRoot}/home/media`;

	// 	// this.s3Storage = new InstanceS3Storage(this.instanceRegistry);
	// 	// await this.copyFilesToS3(pathAlias.resolve('@modules/instanceManager/samples/media/data'));
	// 	await this.processCopyFiles(files);
	// }

	async copyS3Files() {
		this.s3Storage = new InstanceS3Storage(this.instanceRegistry);
		await this.copyFolderToS3(pathAlias.resolve('@modules/instanceManager/samples/media/data'));
	}

	async copyFolderToS3(folder, startFolder = folder) {
		const files = await readdir(folder, {withFileTypes: true});
		if (!files) return;
		for (const file of files) {
			const fullPath = path.join(folder, file.name);
			if (file.isDirectory()) {
				await this.copyFolderToS3(fullPath, startFolder);
			} else {
				const s3Path = fullPath.replace(startFolder + '/', '');

				const uploadProps = {};
				const ext = path.extname(fullPath).toLowerCase();

				if (this.config.imageMagick?.identifyPath) {
					if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
						uploadProps.contentType = await getImgType(fullPath);
					}
				}

				await this.s3Storage.upload(fs.createReadStream(fullPath), s3Path, uploadProps);
			}
		}
	}

	async processCopyFiles(files) {
		for (const [source, destination] of Object.entries(files)) {
			await ncp(source, destination);
		}
	}

	async markAsCreated() {
		await this.instance.changeStatus({status: 'awaitingForClient'});
	}

	async makeFolders(folders) {
		for (const folderName of Array.from(folders)) {
			await mkdirp(`${this.instanceRoot}/${folderName}`);
		}
	}

	async bootstrapInstance() {
		this.instanceRegistry = await bootstrapInstanceById(this.instance.instance_id, false);
		this.instanceRegistry.setDb(this.instanceDb);
	}

	//	Need to be triggered as last item in list
	async triggerCreated() {
		await instances.refreshCache();

		// const redis = wrapperRegistry.getRedisMsgSend();
		// await redis.publish('worker', JSON.stringify({
		// 	type: 'bootstrapInstance',
		// 	data: {
		// 		instance_id: this.instance.instance_id
		// 	}
		// }));

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	getInstance() {
		return this.instance;
	}

	getInstanceDb() {
		return this.instanceDb;
	}

	async setupRobotsTxt() {
		const robots = new RobotsGenerator(this.instanceRegistry);
		await robots.generateAndSet(this.host.host);
	}

	async setupNginx() {
		// since wildcard config is used:
		// await Creator.createNginxConfig(this.instanceRegistry);
	}

	static async createNginxConfig(instanceRegistry) {
		// const domainManager = new DomainManager(instanceRegistry);
		//
		// await domainManager.makeNginxConfig();
		// await DomainManager.reloadNginx();
	}

	async addDemoDelivery() {
		const shipping = {};
		const rows = await this.instanceDb.sql(`
			select
				shipping.*,
				shipping_text.*,
				delivery.delivery_id
			from
				shipping
			inner join shipping_text using(shipping_id)
			left join delivery using(shipping_id)
			where
				shipping.alias in ('rusSnailMail', 'edostCalc', 'boxBerry', 'selfPickup')
		`);

		for (const row of Array.from(rows)) {
			if (!(row.alias in shipping)) {
				shipping[row.alias] = _.extend(row, {
					langs: {}
				});
			}

			shipping[row.alias].langs[row.lang_id] = _.pick(row, ['title']);
		}

		for (const alias of ['rusSnailMail', 'boxBerry', 'selfPickup']) {
			//				if delivery is already exists - skip:
			if (shipping[alias].delivery_id) {
				continue;
			}

			switch (alias) {
				case 'boxBerry':
					await this.addDelivery({
						calc_method: 'byShippingService',
						shipping_id: shipping[alias].shipping_id,
						shipping_config: shipping[alias].settings.system,
						location_shipping_id: null
					}, shipping[alias].langs);
					break;
				case 'rusSnailMail':
					await this.addDelivery({
						calc_method: 'byEdost',
						shipping_id: shipping[alias].shipping_id,
						location_shipping_id: shipping['edostCalc'].shipping_id,
						shipping_config: {
							edost: _.extend(shipping['edostCalc'].settings.demo, {
								providerAlias: ['russianPost', 'ems']
							}),
							defaultPrice: 300
						}
					}, shipping[alias].langs);
					break;
				case 'selfPickup':
					if (!shipping.selfPickup) {
						break;
					}

					await this.addDelivery({
						calc_method: 'byShippingService',
						shipping_id: shipping[alias].shipping_id,
						location_shipping_id: null,
						shipping_config: {
							address: 'Московский пр. 129, Санкт-Петербург\nпн-пт: 09:00 - 18:00'
						}
					}, shipping[alias].langs);
					break;
			}
		}

		await this.instanceDb.sql('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_delivery_city');
		await this.instanceDb.sql('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_delivery_country');
	}

	async addDelivery(delivery, langs) {
		const row = await this.instanceDb.sql(`
			insert into delivery
				(shipping_id, shipping_config, location_shipping_id, calc_method)
			values
				(:shippingId, :shippingConfig, :locationShippingId, :calcMethod)
			returning *
		`, {
			shippingId: delivery.shipping_id,
			shippingConfig: JSON.stringify(delivery.shipping_config),
			locationShippingId: delivery.location_shipping_id,
			calcMethod: delivery.calc_method
		});

		const deliveryId = row.delivery_id;

		for (const langId in langs) {
			await this.instanceDb.sql(`
				update
					delivery_text
				set
					title = :title
				where
					delivery_id = :id
					and lang_id = :lang
			`, {
				id: deliveryId,
				lang: langId,
				title: langs[langId].title
			});
		}

		await this.instanceDb.sql(`
			insert into delivery_site
				(site_id, delivery_id)
			select
				site_id,
				:deliveryId
			from
				site
		`, {
			deliveryId
		});
	}

	setInstanceDb(instanceDb) {
		this.instanceDb = instanceDb;
		return this;
	}

	setSetupS3DemoFiles(val) {
		this.setupS3DemoFiles = val;
		return this;
	}
}
