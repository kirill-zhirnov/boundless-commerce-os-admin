import extend from 'extend';
import fs from 'fs';
import {promisify} from 'util';
const readdir = promisify(fs.readdir);
import InstanceRegistry from '../registry/server/classes/instance'; //eslint-disable-line no-unused-vars
import ExtendedSequelize from '../db/sequelize'; //eslint-disable-line no-unused-vars

export default class BasicPackage {
	constructor(config) {
		this.config = extend(true, {}, config);

//		package root path
		this.packagePath = null;
	}

	/**
	 * @param {InstanceRegistry} instanceRegistry
	 * @returns {Promise<*>}
	 */
	async setupForInstance(instanceRegistry) {
		const db = instanceRegistry.getDb();
		const router = instanceRegistry.getRouter();

		await this.registerModels(db);
		this.setupRelations(db);
		this.setupRoutes(router);
	}

	setupRoutes(router) {
		const routesPath = `${this.getInitPath()}/routes.js`;
		if (fs.existsSync(routesPath)) {
			require(routesPath).default(router);
		}
	}

	/**
	 * @param {ExtendedSequelize} db
	 */
	setupRelations(db) {
		const relationsInitPath = `${this.getInitPath()}/relations.js`;
		if (fs.existsSync(relationsInitPath)) {
			require(relationsInitPath).default(db);
		}
	}

	/**
	 * @param {ExtendedSequelize} db
	 * @returns {Promise<*>}
	 */
	async registerModels(db) {
		if (fs.existsSync(this.getModelsPath())) {
			const files = await readdir(this.getModelsPath());

			for (const modelPath of files) {
				db.import(`${this.getModelsPath()}/${modelPath}`);
			}
		}
	}

	async preRequireInitFiles() {
		if (fs.existsSync(this.getModelsPath())) {
			const files = await readdir(this.getModelsPath());

			for (const modelPath of files) {
				require(`${this.getModelsPath()}/${modelPath}`);
			}
		}
	}

	setPackagePath(path) {
		this.packagePath = path;
	}

	getPackagePath() {
		if ((this.packagePath == null)) {
			throw new Error('You must setup @packagePath before calling this method!');
		}

		return this.packagePath;
	}

	getModelsPath() {
		return `${this.getPackagePath()}/models`;
	}

	getInitPath() {
		return `${this.getPackagePath()}/init`;
	}

	getControllersPath() {
		return `${this.getPackagePath()}/controllers`;
	}

	getViewsPath() {
		return `${this.getPackagePath()}/views`;
	}

	getController(controller, pathPrefix = '') {
		try {
			const ctrlPath = this.getControllerPath(controller, pathPrefix);
			const ctrlClass = require(ctrlPath);
			return (ctrlClass.default) ? ctrlClass.default : ctrlClass;
		} catch (e) {
			if (e.code == 'MODULE_NOT_FOUND') {
				return false;
			} else {
				throw e;
			}
		}
	}

	getControllerPath(controller, pathPrefix = '') {
//		controller = controller.toLowerCase()
//		pathPrefix = pathPrefix.toLowerCase()

		const path = [this.getControllersPath()];
		if (pathPrefix) {
			path.push(pathPrefix);
		}

		path.push(controller);

		return path.join('/');
	}
}