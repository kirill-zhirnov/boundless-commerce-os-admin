// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const http = require('http');
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const wrapperConfig = wrapperRegistry.getConfig();

module.exports.render = function(lessContent, params) {
	if (params == null) { params = {}; }
	const deferred = Q.defer();

	const postData = JSON.stringify({
		lessContent,
		params
	});

	const req = http.request({
		hostname : wrapperConfig.lessServer.host,
		port : wrapperConfig.lessServer.port,
		path : '/render',
		method : 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData)
		}
	}, function(res) {
		let data = '';

		res.setEncoding('utf8');
		res.on('error', e => deferred.reject(e));

		res.on('data', chunk => data += chunk);

		return res.on('end', function() {
			try {
				const parsedResult = JSON.parse(data);

				if (res.statusCode === 200) {
					return deferred.resolve(parsedResult);
				} else {
					return deferred.reject(parsedResult);
				}
			} catch (e) {
				return deferred.reject(e);
			}
		});
	});

	req.write(postData);
	req.on('error', function(e) {
		deferred.reject(e);

	});

	req.end();

	return deferred.promise;
};