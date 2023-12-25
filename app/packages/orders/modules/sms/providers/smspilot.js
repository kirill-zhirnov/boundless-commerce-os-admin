// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const http = require('http');
const pathAlias = require('path-alias');
const querystring = require('querystring');
const BaseProvider = pathAlias('@p-orders/modules/sms/providers/base');

class Smspilot extends BaseProvider {
	send(recipient, message) {
		const deferred = Q.defer();

		const uri = [
			'http://smspilot.ru/api.php',
			'?send=', querystring.escape( message ),
			'&to=', recipient,
			'&from=', this.row.settings.from,
			'&apikey=', this.row.settings.apiKey,
			'&format=json'
		].join('');

		const req = http.get(uri, function(res) {
			let str = '';
			res.on('data', chunk => str += chunk);

			return res.on('end', function() {
				let parsedData;
				try {
					parsedData = JSON.parse(str);
				} catch (e) {
					deferred.reject(str);
					return;
				}

				if ('error' in parsedData) {
					deferred.reject(parsedData);
					return;
				}

				return deferred.resolve();
			});
		});

		req.on('error', err => deferred.reject(err));

		return deferred.promise;
	}
}

module.exports = Smspilot;