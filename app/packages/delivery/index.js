import BasicPackage from '../../modules/packages/basic';
import ExtendedSequelize from '../../modules/db/sequelize';
import {promisify} from 'util';
import pathAlias from 'path-alias';
import fs from 'fs';

const readdir = promisify(fs.readdir);

export default class Package extends BasicPackage {
	constructor(config) {
		super(config);

		this.deliveryDb = null;
	}

	async getDeliveryDb() {
		if (!this.deliveryDb) {
			this.deliveryDb = await this.initDeliveryDb();
		}

		return this.deliveryDb;
	}

	async initDeliveryDb() {
		const db = new ExtendedSequelize(
			this.config.deliveryDb.name,
			this.config.deliveryDb.user,
			this.config.deliveryDb.pass,
			ExtendedSequelize.getConstructOptions(this.config.deliveryDb.config)
		);

//		Manually load models to Db
		const modelsPath = [
			'@p-system/models/lang'
		];

		for (const alias of modelsPath) {
			db.import(pathAlias.resolve(alias));
		}

		const files = await readdir(this.getModelsPath());
		for (const modelPath of files) {
			db.import(`${this.getModelsPath()}/${modelPath}`);
		}

		this.setupRelations(db);

		return db;
	}
}