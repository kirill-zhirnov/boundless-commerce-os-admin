const _ = require('underscore');

const methodMap = {
	create : 'POST',
	update : 'PUT',
	patch :  'PATCH',
	delete : 'DELETE',
	read :   'GET'
};

const urlError = function() {
	throw new Error('A "url" property or function must be specified');
};

const sync = function(method, model, options) {
	if (options == null) { options = {}; }
	let params = {};
	const httpMethod = methodMap[method];

	if (!options.url) {
		params.url = _.result(model, 'url') || urlError();
	}

	if (!('data' in options) && model && (['create', 'update', 'patch'].indexOf(method) !== -1)) {
		params.data = options.attrs || model.toJSON(options);
	}

	if (!('frontController' in options)) {
		throw new Error('You must pass frontController');
	}

	params = _.extend(params, options);
	const promise = options.frontController.runInternal(params.url, httpMethod, params.data);
	promise
	.then(function(response) {
		if (_.isFunction(options.success)) {
			return options.success.call(this, response.getData());
		}}).catch(function(error) {
		if (_.isFunction(options.error)) {
			return options.error.call(this, error.error);
		}}).done();

	return promise;
};

module.exports = sync;