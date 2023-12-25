import utils from '../../utils/common.client';

let clientRegistry;
if (!process.env.__IS_SERVER__) {
	clientRegistry = require('../../registry/client/client.client').clientRegistry;
}

export default class RequestEnvironment {
	constructor(frontController = null) {
		this.frontController = frontController;
	}

	localRender(type, file, data = {}, packageName = null) {
		return this.getView().localRender(type, file, data, packageName);
	}

	widget(name, data = {}) {
		if (process.env.__IS_SERVER__) {
			data.frontController = this.frontController;
		}

		const instance = utils.createWidgetByName(name, data);
		return instance.make();
	}

	getView() {
		if (process.env.__IS_SERVER__) {
			return this.frontController.getView();
		} else {
			return clientRegistry.getView();
		}
	}

	getClientRegistry() {
		if (process.env.__IS_SERVER__) {
			return this.frontController.getClientRegistry();
		} else {
			return clientRegistry;
		}
	}
}