// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const pathAlias = require('path-alias');
const BasicCommand = pathAlias('@modules/commands/basic');
const wrapperBootstrap = pathAlias('@modules/bootstrap/wrapper');
const instances = pathAlias('@modules/instances');
const registry = pathAlias('@registry');

const InstagramRequester = pathAlias('@p-cms/modules/instagramRequester');

class InstagramCommand extends BasicCommand {
	actionGetMedia() {
		const deferred = Q.defer();

		wrapperBootstrap('setupInstances')
		.then(() => {
			return instances.loadCachedData();
	}).then(data => {
			const keys = Object.keys(data.instances);

			let f = Q();

			for (let instId of Array.from(keys)) {
				(instId => {
					return f = f.then(() => {
						const defItem = Q.defer();

						this.getInstanceMedia(instId)
						.then(() => {
							return defItem.resolve();
					}).catch(e => {
							console.error(`Error for instance: ${instId}`, e);

							return defItem.resolve();
						}).done();

						return defItem.promise;
					});
				})(instId);
			}

			return f;
		}).then(() => {
			return deferred.resolve();
		}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}

	actionGetInstanceMedia() {
		const deferred = Q.defer();

		const instId = this.getOption('instance');

		if ((instId == null)) {
			console.error('No instance id specified');
			return;
		}

		wrapperBootstrap('setupInstances')
		.then(() => {
			return this.getInstanceMedia(instId);
	}).then(() => {
			return deferred.resolve();
		}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}

	getInstanceMedia(instId) {
		const deferred = Q.defer();

		const instanceRegistry = registry.getRegistryByInstance(instId);
		const db = instanceRegistry.getDb();

		Q(db.model('instagramConfig').findAll())
		.then(rows => {
			let f = Q();

			for (let row of Array.from(rows)) {
				if (!row.getAccessToken()) {
					continue;
				}

				(row => {
					return f = f.then(() => {
						const defItem = Q.defer();

						const ir = new InstagramRequester(instanceRegistry, row);
						ir.getSelfMedia()
						.then(() => {
							return defItem.resolve();
					}).catch(function(e) {
							console.error(`Error for instance: ${instId}`, e);

							return defItem.resolve();}).done();

						return defItem.promise;
					});
				})(row);
			}

			return f;
	}).then(() => {
			return deferred.resolve();
		}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}
}

module.exports = InstagramCommand;
