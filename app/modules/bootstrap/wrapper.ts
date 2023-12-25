//@ts-ignore
process.env.__IS_SERVER__ = true;

import fs from 'fs';

import pathAlias from 'path-alias';
import aliasesList from '../../config/pathAliases';
pathAlias.setAliases(aliasesList.shouldBeResolved, true);
pathAlias.setAliases(aliasesList.static, false);

import extend from 'extend';
import {IConfig} from '../../@types/config';
import {wrapperRegistry} from '../registry/server/classes/wrapper';
import ExtendedSequelize from '../db/sequelize';
import {createClient as redisCreateClient} from 'redis';
import JadeRenderer from '../viewRenderer/engine/jade';
import imageMagick from 'node-imagemagick';
import PackagesKit from '../packages/kit';
import ServerI18nKit from '../i18n/kit/server';
import AWS from 'aws-sdk';
import _ from 'underscore';
import Cache from '../cache/index';
import {promisify} from 'util';
// import uglifyJS from 'uglify-js';

// const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);

export default class WrapperBootstrapper {
	protected readonly config: IConfig;
	protected db: ExtendedSequelize;

	constructor() {
		this.config = this.makeConfig();
	}

	public async runGeneral() {
		process.setMaxListeners(0);
		wrapperRegistry.setConfig(this.config);

		this.setupDb();
		await this.setupInstanceManagerModels();
		await this.setupRedis();
		this.setupView();
		this.setupImageMagick();
		await this.setupPackages();
		this.setupI18nKit();
		this.setupPackageJson();
		this.setupAWS();
		await this.setupGeneralCache();
	}

	public async run() {
		await this.runGeneral();
		// await this.setupClientLoader();

		// if (!this.config.debug) {
			await this.preloadInstanceDbModels();
		// }
	}

	protected setupDb() {
		this.db = new ExtendedSequelize(this.config.db.name, this.config.db.user, this.config.db.pass, ExtendedSequelize.getConstructOptions(this.config.db.config));

		wrapperRegistry.setDb(this.db);
	}

	protected async setupInstanceManagerModels() {
		const modelsPath = pathAlias.resolve('@modules/instanceManager/models');
		const files = await readDir(modelsPath);

		for (const file of files) {
			this.db.import(`${modelsPath}/${file}`);
		}

		require('../instanceManager/init/relations').default(this.db);
	}

	protected async setupRedis() {
		const redis = redisCreateClient({...this.config.redis.options, legacyMode: true});
		// const redisMsg = redisCreateClient({...this.config.redis.options});
		// const redisMsgSend = redisCreateClient({...this.config.redis.options});

		await redis.connect();
		// await redisMsg.connect();
		// await redisMsgSend.connect();

		wrapperRegistry
			.setRedis(redis)
			// .setRedisMsg(redisMsg)
			// .setRedisMsgSend(redisMsgSend)
		;

		return this;
	}

	protected setupView() {
		wrapperRegistry.setView(new JadeRenderer(this.config.viewRenderer.config));
	}

	protected setupImageMagick() {
		if (this.config.imageMagick?.convertPath) {
			imageMagick.convert.path = this.config.imageMagick.convertPath;
		}

		if (this.config.imageMagick?.identifyPath) {
			return imageMagick.identify.path = this.config.imageMagick.identifyPath;
		}
	}

	protected async setupPackages() {
		const kit = new PackagesKit({
			pathToPackages: pathAlias.resolve('app/packages')
		}, this.config.packages);
		await kit.init();

		wrapperRegistry.setPackagesKit(kit);
	}

	protected setupI18nKit() {
		wrapperRegistry.setI18nKit(new ServerI18nKit());
	}

	protected setupPackageJson() {
		const packageJson = require(`${pathAlias.getRoot()}/package.json`);
		process.env.VERSION = packageJson.version;
	}

	protected setupAWS() {
		AWS.config.update(_.pick(this.config.aws, ['accessKeyId', 'secretAccessKey']));
		AWS.config.update(_.pick(this.config.aws, ['region']));
	}

	protected async setupGeneralCache() {
		const cache = new Cache(this.config.cache);
		await cache.warmUp();

		wrapperRegistry.setGeneralCache(cache);
	}

	// protected async setupClientLoader() {
	// 	const clientLoader = await wrapperRegistry.getGeneralCache().load('clientLoaderSource', async () => {
	// 		const jsContent = await readFile(pathAlias.resolve('@modules/bootstrap/client/loader.js'), {encoding : 'utf-8'});
	// 		const {code} = uglifyJS.minify(jsContent);
	//
	// 		return code;
	// 	});
	//
	// 	wrapperRegistry.setClientLoader(clientLoader);
	// }

	protected makeConfig(): IConfig {
		const envPath = pathAlias.resolve('.env');
		const configPath = pathAlias.resolve('config.js');

		let localConfig = {};

		if (fs.existsSync(configPath)) {
			localConfig = require(configPath);
		} else if (fs.existsSync(envPath)) {
			require('dotenv').config();
		}

		const configMain = require('../../config/main');
		const config = extend(true, configMain, localConfig) as unknown as IConfig;

		if (!config.serverAlias) {
			throw new Error('You need to specify \'serverAlias\' in your local config!');
		}

		return config;
	}

	protected async preloadInstanceDbModels() {
		await wrapperRegistry.getPackagesKit().warmUpPackages();
	}
}

export async function run() {
	const instance = new WrapperBootstrapper();
	return instance.run();
}

export async function runGeneral() {
	const instance = new WrapperBootstrapper();
	return instance.runGeneral();
}

export async function shutDown() {
	if (wrapperRegistry.hasRedis()) {
		//bug: quit leads to error: "Socket closed unexpectedly"
		await wrapperRegistry.getRedis().disconnect();
	}

	if (wrapperRegistry.hasRedisMsg()) {
		await wrapperRegistry.getRedisMsg().quit();
	}

	if (wrapperRegistry.hasRedisMsgSend()) {
		await wrapperRegistry.getRedisMsgSend().quit();
	}

	if (wrapperRegistry.hasDb()) {
		await wrapperRegistry.getDb().close();
	}

	if (wrapperRegistry.hasMemCache()) {
		await wrapperRegistry.getMemCache().quit();
	}
	// if registry.has('sphinx')
	// 	registry.getSphinx().close()
}