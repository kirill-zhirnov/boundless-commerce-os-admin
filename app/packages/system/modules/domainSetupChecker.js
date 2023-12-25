// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const db = wrapperRegistry.getDb();
const Q = require('q');
const followRedirects = require('follow-redirects');
const instanceRegistries = pathAlias('@registry');

// The class checks, if user's domain point to our servers (setup correctly) - set
// setting system.redirectSystemToPrimary = true, otherwise - false.
class DomainSetupChecker {
	check() {
		const deferred = Q.defer();

		db.sql(`\
select \
instance_id, \
host.host \
from \
host \
inner join instance using(instance_id) \
where \
host.type = 'primary' \
and instance.status in ('available', 'unavailable')\
`).then(rows => {
			let f = Q();

			for (let row of Array.from(rows)) {
				(row => {
					return f = f.then(() => {
						return this.checkInstanceDomain(row.instance_id, row.host);
					});
				})(row);
			}

			return f;
	}).then(() => {
			return deferred.resolve();
		}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}

	checkInstanceDomain(instanceId, host) {
		const deferred = Q.defer();

		let checkResult = null;
		const instanceReg = instanceRegistries.getRegistryByInstance(instanceId);
		const instanceSettings = instanceReg.getSettings();

		this.checkHost(host)
		.then(val => {
			checkResult = val;

			return instanceSettings.get('system', 'redirectSystemToPrimary');
	}).then(settingVal => {
			if (settingVal !== checkResult) {
				return instanceSettings.set('system', 'redirectSystemToPrimary', checkResult);
			}
		}).then(() => {
			return deferred.resolve();
			}).catch(function(e) {
			console.error(e);

			return deferred.resolve();}).done();

		return deferred.promise;
	}

	checkHost(host) {
		const deferred = Q.defer();

		followRedirects.http.get(`http://${host}`, function(response) {
			let out = false;
			if (response.headers && 'x-powered-by' in response.headers) {
				if (response.headers['x-powered-by'] === 'sellios') {
					out = true;
				}
			}

			return deferred.resolve(out);
		}).on('error', err => deferred.resolve(false));

		return deferred.promise;
	}
}

module.exports = DomainSetupChecker;