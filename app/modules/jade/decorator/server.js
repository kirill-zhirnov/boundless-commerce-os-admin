import BasicDecorator from './basic.client';
// import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import _ from 'underscore';
// import {VM} from 'vm2';
// import jade from 'jade';
import utils from '../../utils/common.client';
import {IFrontController} from '../../../@types/frontController';

export default class ServerJadeDecorator extends BasicDecorator {
	constructor() {
		super(...arguments);

		/**
		 * @type {IFrontController}
		 */
		this.frontController = null;

		this.i18n = null;
		this.locale = null;

		this.compiledStr = null;
	}

	async render(tplScript) {
		this.beforeRender();

		this.compiledStr = tplScript(this.locals);

		return this.processRenderingPromises();
	}

	renderSandbox(tplVmScript) {
		throw new Error('This method is deprecated. Render shouldnt be run in sandbox');

		// this.beforeRender();

		// const requiredModules = _.keys(require.cache);
		//
		// try {
		// 	const sandbox = {
		// 		locals: this.locals,
		// 		jadeRuntime: Object.create(jade.runtime)
		// 	};
		//
		// 	if (wrapperRegistry.getConfig().debug) {
		// 		sandbox.console = console;
		// 	}
		//
		// 	const vm = new VM({
		// 		timeout: wrapperRegistry.getConfig().viewRenderer.vmTimeout,
		// 		sandbox
		// 	});
		//
		// 	this.compiledStr = vm.run(tplVmScript);
		// } catch (e) {
		// 	if (e.message === 'Script execution timed out.') {
		// 		const toClear = _.difference(_.keys(require.cache), requiredModules);
		// 		for (let key of Array.from(toClear)) {
		// 			delete require.cache[key];
		// 		}
		// 	}
		//
		// 	return Q.reject(e);
		// }

		// return this.processRenderingPromises();
	}

	beforeRender() {
		if (!this.wasSetUp) {
			this.registerMethodsInLocals();
		}
	}

	registerMethodsInLocals(...args) {
		//@ts-ignore
		super.registerMethodsInLocals(...args);

//		We need to deny some methods due to the security:
		const localUnderscore = Object.assign({}, _);

//		this code in template may down the process: - var a = _.template("<% process.exit() %>");a();
//		it will not be catched by VM2
		localUnderscore.template = function () {
			throw new Error('_.template is not allowed!');
		};

		return this.locals['_'] = localUnderscore;
	}

	/**
	 * @returns {Promise<string>}
	 */
	async processRenderingPromises() {
//		parts = @dividePromisesByParts()
//		f = Q()
//		for row, i in parts
//			do (row, i) =>
//				f = f.then () =>
//					return @processWidgetsPart row

//		Run widgets run by one: same widgets which included twice (e.g. menu),
//		will use cache. If we run it in parallels - it will not.
		for (let row of this.promises) {
			await this.processWidget(row);
		}

		return this.compiledStr;
	}

	// processWidgetsPart(part) {
	// 	const promises = [];
	// 	for (let widget of Array.from(part)) {
	// 		promises.push(this.processWidget(widget));
	// 	}
	//
	// 	return Q.allSettled(promises);
	// }

	async processWidget({name, options, placeholder}) {
		const instance = utils.createWidgetByName(name, this.prepareWidgetOptions(name, options));
		const res = await instance.make();

		this.compiledStr = this.compiledStr.replace(placeholder, res);
	}

	getFrontController() {
		if (!this.frontController) {
			throw new Error('You must setup frontController!');
		}

		return this.frontController;
	}

	/**
	 * @param {IFrontController} frontController
	 * @returns {ServerJadeDecorator}
	 */
	setFrontController(frontController) {
		this.frontController = frontController;
		return this;
	}

	getClientRegistry() {
		return this.getFrontController().getClientRegistry();
	}

	url(...args) {
		const router = this.getFrontController().getInstanceRegistry().getRouter();
		//@ts-ignore
		return router.url(...args);
	}

	prepareWidgetOptions(name, options) {
		const widgetOptions = _.extend({}, options);
		widgetOptions.frontController = this.getFrontController();

//		Keys in Backbone.View, which we don't allow to pass a callback:
//		Errors in callbacks (infinite loops) is not catched by VM2
		const dangerKeys = [
			'events', 'attributes', 'id', 'className', 'tagName', 'el',
			'lazyInit', 'clientExport',
		];

		for (let key of Array.from(dangerKeys)) {
			if (_.isFunction(widgetOptions[key])) {
				throw new Error(`Key '${key}' can't be a function. Widget: '${name}'.`);
			}
		}

		return widgetOptions;
	}

	getI18n(...args) {
		if (this.i18n) {
			return this.i18n;
		}

		//@ts-ignore
		return super.getI18n(...args);
	}

	getLocale(...args) {
		if (this.locale) {
			return this.locale;
		}

		//@ts-ignore
		return super.getLocale(...args);
	}

	setI18n(i18n) {
		this.i18n = i18n;
		return this;
	}

	setLocale(locale) {
		this.locale = locale;
		return this;
	}

	getThemeUrl(url) {
		return '/no-theme-yet-';
		// return `${this.getFrontController().getView().getTheme().getThemeUrl()}${url}`;
	}

	/**
	 * @param name
	 * @param options
	 * @returns {string}
	 */
	widget(name, options = {}) {
		const placeholder = this.getPromisePlaceholder(this.promises.length);

		this.promises.push({
			name,
			options,
			placeholder
		});

		return placeholder;
	}

	// dividePromisesByParts() {
	// 	const size = 1;
	// 	const iterations = Math.ceil(this.promises.length / size);
	// 	const parts = [];
	//
	// 	let i = 0;
	// 	while (i < iterations) {
	// 		parts.push(this.promises.splice(0, size));
	// 		i++;
	// 	}
	//
	// 	return parts;
	// }
}
