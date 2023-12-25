const Backbone = require('backbone');

require('./setup.client');
// let clientRegistry, ajax;

// if it is server side - replace sync to make internal requests
if (process.env.__IS_SERVER__) {
	// Backbone.sync = require('./server/sync');
} else {
	// clientRegistry = require('../registry/client/client.client').clientRegistry;
	const ajax = require('../ajax/kit.client');

	//@ts-ignore
	Backbone.ajax = function(settings = {}) {
		const request = ajax.make(settings.url, settings);

		return request.run();
	};
}

// Backbone.url = function(urlPath, params = {}, isAbsolute = false, langCountry = null, frontController = null) {
// 	if (process.env.__IS_SERVER__) {
// 		if (!frontController) {
// 			throw new Error('You must pass frontController to model or collection!');
// 		}
//
// //		don't use langCountry for internal requests
// // 		if ((langCountry == null)) {
// // 			langCountry = false;
// // 		}
//
// 		return frontController.url(urlPath, params, isAbsolute);
// 	} else {
// 		return clientRegistry.getRouter().url(urlPath, params, isAbsolute);
// 	}
// };

module.exports = Backbone;