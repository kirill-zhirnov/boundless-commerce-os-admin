const extend = require('extend');
const errors = require('../errors/errors');
import InstanceRegistry from '../registry/server/classes/instance';

export default class PackagesKit {
	constructor(config, packagesConfig) {
		this.config = extend(true, {
			pathToPackages : null
		}, config);

		this.packagesConfig = extend(true, {}, packagesConfig);
		this.loadedPackages = {};
	}

	init() {
		if (!this.config.pathToPackages) {
			throw new errors.RuntimeError('You have to setup @config.pathToPackages before calling this method.');
		}

		for (const name of Object.keys(this.packagesConfig)) {
			const Package = this.requirePackage(name);
			const config = this.packagesConfig[name];

			const packageInstance = new Package(config);
			packageInstance.setPackagePath(`${this.config.pathToPackages}/${name}`);

			this.loadedPackages[name] = packageInstance;
		}
	}

	/**
	 * Load DB models, relations, routes for each instance (db instance, router instance):
	 *
	 * @param {InstanceRegistry} instanceRegistry
	 * @returns {Promise<*>}
	 */
	async setupPackagesByInstance(instanceRegistry) {
		for (const name of Object.keys(this.loadedPackages)) {
			const packageInstance = this.loadedPackages[name];
			await packageInstance.setupForInstance(instanceRegistry);
		}
	}

	get(name) {
		if (this.has(name)) {
			return this.loadedPackages[name];
		} else {
			throw new errors.RuntimeError(`Package ${name} does not exist!`);
		}
	}

	has(name) {
		if (this.loadedPackages[name] != null) {
			return true;
		}

		return false;
	}

	requirePackage(name) {
		const val = require(`${this.config.pathToPackages}/${name}/index`);

		return val.default ? val.default : val;
	}

	async warmUpPackages() {
		for (const name of Object.keys(this.loadedPackages)) {
			const packageInstance = this.loadedPackages[name];
			await packageInstance.preRequireInitFiles();
		}
	}
}