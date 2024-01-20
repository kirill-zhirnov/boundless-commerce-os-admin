// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const wrapperConfig = wrapperRegistry.getConfig();
const InstanceBootstrapper = pathAlias('@modules/bootstrap/instance');
const instances = pathAlias('@modules/instances');
const Sequelize = pathAlias('@modules/db/sequelize');

const views = {
	regions : [
		'vw_city',
		'vw_country',
		'vw_region'
	],
	shipping : [
		'vw_delivery_city',
		'vw_delivery_country',
		'vw_shipping',
		// 'vw_shipping_city',
		// 'vw_shipping_zip'
	]
};

module.exports.refresh = function(scopes) {
	let dbList = [this.getSampleDb()];
	return this.getInstancesDb()
	.then(res => {
		dbList = dbList.concat(res);

		let f = Q();
		for (let scope of Array.from(scopes)) {
			for (let db of Array.from(dbList)) {
				((scope, db) => {
					return f = f.then(() => {
						return this.refreshForDb(db, views[scope]);
				});
				})(scope, db);
			}
		}

		return f;
}).then(() => {
		let f = Q();
		for (let db of Array.from(dbList)) {
			(db => {
				return f = f.then(() => {
					return db.close();
				});
			})(db);
		}
		return f;
	}).then(() => {
	});
};

module.exports.refreshForDb = function(db, views) {
	let f = Q();
	for (let view of Array.from(views)) {
		((view => f = f.then(() => {
            const deferred = Q.defer();

            db.sql(`refresh materialized view ${view}`)
            .then(() => {
                return deferred.resolve();
        }).catch(function(e) {
                console.error(`Error refreshing view: '${view}'`, db.config);

                return deferred.reject(e);}).done();

            return deferred.promise;
        })))(view);
	}

	return f;
};

module.exports.getSampleDb = () => new Sequelize(
    wrapperConfig.instanceManager.db.sample,
    wrapperConfig.db.user,
    wrapperConfig.db.pass,
    wrapperConfig.db.config
);

module.exports.getInstancesDb = function() {
	const out = [];
	return instances.loadAndPutInCache()
	.then(data => {
		let f = Q();

		for (let key in data.instances) {
			const instance = data.instances[key];
			(instance => {
				return f = f.then(() => {
					//  connect with wrapper user and pass, since wrapper is owner of all tables in postgres
					const bootstrapper = new InstanceBootstrapper(instance);
					return bootstrapper.runDb()
					.then(() => {
						const instanceConfig = bootstrapper.getInstanceRegistry().getConfig();

						const instanceDb = new Sequelize(instanceConfig.db.name, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config);

						out.push(instanceDb);

					});
				});
			})(instance);
		}

		return f;
}).then(() => {
		return out;
	});
};

