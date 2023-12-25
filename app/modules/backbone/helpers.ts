import BasicController from '../controller/basic';

let clientRegistry;
if (!process.env.__IS_SERVER__) {
	clientRegistry = require('../registry/client/client.client').clientRegistry;
}

export function backboneUrl(urlPath: string, params: {[key: string]: string|number} = {}, isAbsolute: boolean = false, frontController: BasicController|null = null) {
	if (process.env.__IS_SERVER__) {
		if (!frontController) {
			throw new Error('You must pass frontController to model or collection!');
		}

		return frontController.url(urlPath, params, isAbsolute);
	} else {
		return clientRegistry.getRouter().url(urlPath, params, isAbsolute);
	}
}