import {backboneUrl} from '../helpers';

import Backbone from 'backbone';
import _ from 'underscore';

let utils;
if (process.env.__IS_SERVER__) {
	utils = require('../../utils/server');
} else {
	utils = require('../../utils/common.client');
}

if (!('My' in Backbone)) {
	//@ts-ignore
	Backbone.My = {};
}

export default class MyBackboneModel extends Backbone.Model {
	constructor(attributes, options) {
		super(...arguments);

//		See comment at MyCollection.frontController
		this.frontController = null;

		if (options && options.frontController) {
			this.frontController = options.frontController;
		}
	}

	serialize() {
		return {
			path : this.getPath(),
			//@ts-ignore
			data : this.toJSON()
		};
	}

//	Returns path relative to the root, without extension
	getPath() {
		const fileName = this.getFileName();

		if (fileName === __filename) {
			throw new Error('You must redefine @getFileName to properly use getPath method!');
		}

		return utils.getPathRelativeToRealRoot(fileName);
	}

	getFileName() {
		return __filename;
	}

	sync(method, model, options) {
		if (this.frontController != null) {
			options.frontController = this.frontController;
		}

		return super.sync(method, model, options);
	}

	createUrl(urlPath, params = {}, isAbsolute = false) {
		return backboneUrl(urlPath, params, isAbsolute, this.frontController);
	}

	//@ts-ignore
	url() {
		//@ts-ignore
		const base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();

		//@ts-ignore
		if (this.isNew()) {
			return base;
		}

		//@ts-ignore
		return base.replace(/([^\/])$/, '$1/?id=' + encodeURIComponent(this.id));
	}

	static unSerialize(data) {
		return new (this)(data);
	}
}

var urlError = function() {
	throw new Error('A "url" property or function must be specified');
};

//@ts-ignore
Backbone.My.Model = MyBackboneModel;