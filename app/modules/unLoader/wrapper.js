// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Q = require('q');
const instances = pathAlias('@modules/registry/server/instance');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const express = require('express');

class WrapperUnLoader {
	constructor(server) {
		this.server = server;
	}

	init() {
		process.on('SIGINT', this.shutdown.bind(this));
	}

	shutdown() {
		this.server.close(() => {
			return this.shutdownInstances()
			.then(() => {
				return this.shutdownWrapper();
		}).then(() => {
				const shutProcess = () => {
					return process.exit(0);
				};

				return setTimeout(shutProcess, 1000);
			}).done();
		});

	}

	shutdownInstances() {
		const deferred = Q.defer();

		const ids = instances.getInstancesIdList();

		let f = Q();

		for (let id of Array.from(ids)) {
			(id => {
				return f = f.then(() => {
					const def = Q.defer();

					const registry = instances.getRegistryByInstance(id);

					Q()
					.then(() => {
						if (registry.has('db') != null) {
							return registry.getDb().close();
						}
				}).then(() => {
						if (registry.has('sphinx')) {
							return registry.getSphinx().close();
						}
						}).then(() => {
						return def.resolve();
						}).catch(e => {
						return def.resolve();
					}).done();

					return def.promise;
				});
			})(id);
		}

		f
		.then(() => {
			return deferred.resolve();
	}).catch(e => {
			return deferred.resolve();
		}).done();

		return deferred.promise;
	}


	shutdownWrapper() {
		const deferred = Q.defer();

		Q()
		.then(() => {
			if (wrapperRegistry.has('db')) {
				return wrapperRegistry.getDb().close();
			}
	}).then(() => {
			if (wrapperRegistry.has('sphinx')) {
				return wrapperRegistry.getSphinx().close();
			}
			}).then(() => {
			if (wrapperRegistry.has('redis')) {
				return wrapperRegistry.getRedis().quit();
			}
			}).then(() => {
			if (wrapperRegistry.has('redisMsg')) {
				return wrapperRegistry.getRedisMsg().quit();
			}
			}).then(() => {
			if (wrapperRegistry.has('redisMsgSend')) {
				return wrapperRegistry.getRedisMsgSend().quit();
			}
			}).then(() => {
			return deferred.resolve();
			}).catch(e => {
			return deferred.resolve();
		}).done();

		return deferred.promise;
	}
}

module.exports = WrapperUnLoader;
