// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const _ = require('underscore');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const utils = pathAlias('@utils');
const registry = pathAlias('@registry');

class InstanceUnLoader {
	constructor(instanceId) {
		this.instanceId = instanceId;
		this.registry = null;
	}

	run() {
		return utils.runFlow(this, [
			'setupRegistry',
			'disconnectDb',
			'clearCache',
			'unsetRegistry'
		]);
	}

	setupRegistry() {
		if (registry.hasInstanceRegistry(this.instanceId)) {
			return this.registry = registry.getRegistryByInstance(this.instanceId);
		}
	}

	disconnectDb() {
		if (this.registry && this.registry.has('db')) {
			return this.registry.getDb().close();
		}
	}

	clearCache() {
		if (this.registry && this.registry.has('cache')) {
			return this.registry.getCache().clean();
		}
	}

	unsetRegistry() {
		if (this.registry) {
			this.registry.variables = {};
			registry.rmRegistryByInstance(this.instanceId);
			return this.registry = null;
		}
	}
}

module.exports = InstanceUnLoader;