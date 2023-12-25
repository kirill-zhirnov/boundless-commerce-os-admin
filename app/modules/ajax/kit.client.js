const Request = require('./request.client').default;
const _ = require('underscore');

let clientRegistry;
if (!process.env.__IS_SERVER__) {
	clientRegistry = require('../registry/client/client.client').clientRegistry;
}

const loading = {};

module.exports.make = function(url, settings = {}) {
	return new Request(url, settings, this);
};

module.exports.get = function(url, data, settings = {}) {
	settings.type = 'GET';
	settings.data = data;

	const request = this.make(url, settings);
	return request.run();
};

module.exports.post = function(url, data, settings = {}) {
	settings.type = 'POST';
	settings.data = data;

	const request = this.make(url, settings);
	return request.run();
};

module.exports.startLoading = function(request) {
	const showLoading = !this.isLoading();

	loading[request.getId()] = request;

	if (showLoading && clientRegistry) {
		clientRegistry.getTheme().showAjaxLoading();
	}

	return this;
};

module.exports.endLoading = function(request) {
	if (request.getId() in loading) {
		delete loading[request.getId()];
	}

	if (!this.isLoading() && clientRegistry) {
		clientRegistry.getTheme().hideAjaxLoading();
	}

	return this;
};

module.exports.isLoading = () => _.size(loading) > 0;
