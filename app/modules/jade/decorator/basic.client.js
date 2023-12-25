import utils from '../../utils/common.client';
import gHtml from '../../gHtml/index.client';
import gHtmlActive from '../../gHtml/active.client';
import bs from '../../gHtml/bs.client';
import _ from 'underscore';
import formatIo from 'format-io';
import {IClientRegistry} from '../../../@types/registry/clientRegistry';

let clientRegistry;
if (!process.env.__IS_SERVER__) {
	/**
	 * @type {IClientRegistry}
	 */
	clientRegistry = require('../../registry/client/client.client').clientRegistry;
}

export default class JadeDecorator {
	constructor(locals = {}) {
		this.locals = locals;
		this.promises = [];

		this.nameRegExp = /^([^\.]+)\.(.+)/i;

		this.wasSetUp = false;
	}

	/**
	 * @param jadeCallback
	 * @returns {Promise<string>}
	 */
	async render(jadeCallback) {
		let compiledStr;
		if (!this.wasSetUp) {
			this.registerMethodsInLocals();
		}

		try {
			compiledStr = jadeCallback.call(this, this.locals);

			const resolvedPromises = await Promise.allSettled(this.promises);
			for (let key = 0; key < resolvedPromises.length; key++) {
				const val = resolvedPromises[key];
				if (val.status === 'fulfilled') {
					compiledStr = compiledStr.replace(this.getPromisePlaceholder(key), val.value);
				}
			}

			return compiledStr;
		} catch (e) {
			if (process.env.NODE_ENV === 'development') {
				console.error(e);
				console.log('Compiled callback:', jadeCallback.toString());
			} else {
				console.error('Error during rendering tpl...');
			}
			// console.log('error caught:');
			// console.error(e);
			throw new Error('Cannot render Jade callback');
		}
	}

	registerMethodsInLocals() {
		this.wasSetUp = true;

		for (let method of ['widget', '__', 'n__', 'p__', 'np__', 'url', 'urlPk', 'getThemeUrl']) {
			if (method in this.locals) {
				throw new Error(`Key '${method}' has already registered in locals array!`);
			}

			(method => {
				return this.locals[method] = function() {
					return this[method].apply(this, arguments);
				}.bind(this);
			})(method);
		}

//		add variables:
		this.locals['gHtml'] = gHtml;
		this.locals['gHtmlActive'] = gHtmlActive;
		this.locals['bs'] = bs;
		this.locals['i18n'] = this.getI18n();
		this.locals['locale'] = this.getLocale();
		this.locals['_'] = _;
		this.locals['formatIo'] = formatIo;
		this.locals['getStaticContentUrl'] = _.bind(utils.getStaticContentUrl, utils);
		this.locals['getGlobalStaticUrl'] = _.bind(utils.getGlobalStaticUrl, utils);
		this.locals['utils'] = utils;

	}

	registerPromise(promise) {
		this.promises.push(promise);

		return this.getPromisePlaceholder(this.promises.length - 1);
	}

	getThemeUrl(url) {
		return `${clientRegistry.getTheme().getThemeUrl()}${url}`;
	}

//	name - string - should be: package.fileName. Aliases possible, for example:
//	user.usersList.@c
	widget(name, options) {
		if (options == null) { options = {}; }
		const instance = utils.createWidgetByName(name, this.prepareWidgetOptions(options));

		return this.registerPromise(instance.make());
	}

	prepareWidgetOptions(options) {
		return _.extend({}, options);
	}

	getPromisePlaceholder(id) {
		return `{_promise-${id}_}`;
	}

	hasFrontController() {
		return false;
	}

	/**
	 * @returns {IClientRegistry}
	 */
	getClientRegistry() {
		return clientRegistry;
	}

	url() {
		//@ts-ignore
		return this.getClientRegistry().getRouter().url(...arguments);
	}

	urlPk() {
		const args = _.toArray(arguments);
		const pk = args.splice((args.length - 1), 1)[0];

		let url = this.url.apply(this, args);

		if (pk) {
			url = url.replace('{pk}', pk);
		}

		return url;
	}

	getI18n() {
		return this.getClientRegistry().getI18n();
	}

	getLocale() {
		return this.getClientRegistry().getLocale();
	}

	__() {
		return this.getI18n().__.apply(this.getI18n(), arguments);
	}

	n__() {
		return this.getI18n().n__.apply(this.getI18n(), arguments);
	}

	p__() {
		return this.getI18n().p__.apply(this.getI18n(), arguments);
	}

	np__() {
		return this.getI18n().np__.apply(this.getI18n(), arguments);
	}
}