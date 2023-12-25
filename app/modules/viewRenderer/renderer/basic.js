import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import fs from 'fs';
import _ from 'underscore';
import JadeDecorator from '../../jade/decorator/server';
import extend from 'extend';
import utils from '../../utils/server';
import {VMScript} from 'vm2';
import Locale from '../../locale';
import jade from 'jade';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

export default class BasicRenderer {
	constructor(config = {}) {
		this.config = extend(true, {
			useCache: true
		}, config);

		this.theme = null;
		this.cache = null;
		this.globalViewData = null;

		this.pathAliases = {};
		this.allowedPaths = [];
	}

//	type - string - entity name. Could be: file|controller|widget
//	file - local path
//	Path can be related to "app/views" - path, related to global views.
// 	If package name passed, path will be related to package path: @packageName/views.
	async localRender(type, file, data = {}, packageName = null) {
//		timerPrefix = "#{type}-#{file}-#{Math.random()}"
		const resolvedPath = this.resolveLocalPath(type, file, packageName);

		return this.render(resolvedPath.path, data, resolvedPath.sandbox);
	}

//	see comments for @localRender()
	async localCompileClient(type, file, data = {}, packageName = null) {
		const resolvedPath = this.resolveLocalPath(type, file, packageName);

		return this.compileClient(resolvedPath.path, data);
	}

	resolveLocalPath(type, file, packageName = null) {
		let resolvedPath;
		if ((type !== 'file') && (type !== 'absolute') && (type !== 'layout') && !packageName) {
			throw new Error(`If type is not a file you have to pass a package!. Passed: '${type}', '${file}', '${packageName}'`);
		}

//		Theme cannot redefine widgets (lets try it).
//		if type != 'layout' && type != 'file'
//			return {
//				path : wrapperRegistry.getView().resolveLocalPath type, file, packageName
//				sandbox : false
//			}

		if (type === 'layout') {
			type = 'file';

			if (file[0] !== '$') {
				file = `layouts/${file}`;
			}
		}

		if ((type === 'file') && (file[0] === '$')) {
			return {
				path: this.preparePrefixedPath(file),
				sandbox: false
			};
		}


		if (this.theme) {
			resolvedPath = this.theme.resolveTplPath(type, wrapperRegistry.getView().addExtension(file), packageName);
		}

		if (!resolvedPath) {
			resolvedPath = wrapperRegistry.getView().resolveLocalPath(type, file, packageName);
		}

		// sandbox is always false since we test templates on source save
		return {
			path: resolvedPath,
			sandbox: false
		};
	}

	preparePrefixedPath(file) {
		const path = utils.replaceAliasInPath(file, this.pathAliases);
		return wrapperRegistry.getView().addExtension(path);
	}

//	Proxy methods
	async render(absolutePath, data, sandbox = false) {
		const tplScript = await this.compileServer(absolutePath, sandbox);

		if (this.globalViewData) {
			data = _.extend({}, this.globalViewData, data);
		}

		const decorator = this.setupJadeDecorator(data);

		if (sandbox) {
			throw new Error('Sandbox is true. Are you sure?');

			// return decorator.renderSandbox(tplScript);
		} else {
			return decorator.render(tplScript);
		}
	}

	async renderSandboxBySrc(src, absolutePath, options = {}) {
		let tpl;
		const data = options.useMock ? this.getMockData() : {};

		_.extend(data, this.globalViewData, options.data);

		// try {
		tpl = this.compile2Str(src, absolutePath, {sandbox: true});
		// } catch (e) {
		// 	return Q.reject(e);
		// }

		tpl = this.prepareVmTpl(tpl);
		const decorator = this.setupJadeDecorator(data);

		return decorator.renderSandbox(tpl);
	}

	setupJadeDecorator(data) {
		const decorator = new JadeDecorator(data);

		const i18n = wrapperRegistry.getI18nKit().createDefaultI18n();
		const locale = new Locale({
			i18n
		});

		decorator.setI18n(i18n);
		decorator.setLocale(locale);

		return decorator;
	}

	async compileServer(absolutePath, sandbox) {
		let tplSource;

		if (this.config.useCache) {
			tplSource = await this.cache.load(`tpl-s-${absolutePath}`, async () => await this.getServerCompiledTpl(absolutePath));
		} else {
			tplSource = await this.getServerCompiledTpl(absolutePath);
		}

		let out;
		if (sandbox) {
			out = this.prepareVmTpl(tplSource);
		} else {
			const fn = new Function('locals, jade', tplSource);
			out = locals => fn(locals, Object.create(jade.runtime));
		}

		return out;
	}

	prepareVmTpl(tplSource) {
		return new VMScript(`(function(locals, jade){${tplSource}})(locals,jadeRuntime)`);
	}

	/**
	 * Returns string, which contains Jade compiled function.
	 *
	 * @param {string} absolutePath
	 * @returns {Promise<string>}
	 */
	async getServerCompiledTpl(absolutePath) {
		const tplSource = await readFile(absolutePath, {encoding: 'utf8'});
		return this.compile2Str(tplSource, absolutePath);
	}

	/**
	 * @param {string} tplSource
	 * @param {string} absolutePath
	 * @param {{}} options
	 * @returns {string}
	 */
	compile2Str(tplSource, absolutePath, options = {}) {
		return wrapperRegistry.getView().compile2Str(tplSource, _.extend({
				filename: absolutePath,
				pathAliases: this.pathAliases,
				allowedPaths: this.allowedPaths
			}, options)
		);
	}

	async compileClient(absolutePath, data = {}) {
		this.extendData(data, {
			filename: absolutePath,
			pathAliases: this.pathAliases,
			allowedPaths: this.allowedPaths
		});

		if (this.config.useCache) {
			return await this.cache.load(`tpl-c-${absolutePath}`, async () => await wrapperRegistry.getView().compileClient(absolutePath, data));
		} else {
			return await wrapperRegistry.getView()
				.compileClient(absolutePath, data);
		}
	}

	extendData(data, newItems) {
		return wrapperRegistry.getView().extendData(data, newItems);
	}

	setGlobalViewData(globalViewData) {
		this.globalViewData = globalViewData;
		return this;
	}

	setCache(cache) {
		this.cache = cache;
		return this;
	}

	getCache() {
		return this.cache;
	}

	setTheme(theme) {
		this.theme = theme;
		return this;
	}

	getTheme() {
		return this.theme;
	}

	getGlobalViewData(key, defaultVal = null) {
		if (_.isObject(this.globalViewData) && key in this.globalViewData) {
			return this.globalViewData[key];
		}

		return defaultVal;
	}

	getMenu() {
		if (this.theme) {
			return this.theme.getMenu();
		} else {
			return _.extend({}, wrapperRegistry.getView().getConfig().menu);
		}
	}

	getPublicLayouts() {
		const publicLayouts = _.extend({}, wrapperRegistry.getView().getConfig().publicLayouts);

		if (this.theme) {
			_.extend(publicLayouts, this.theme.getPublicLayouts());
		}

		return publicLayouts;
	}

	getPublicLayoutsOptions(out) {
		if (out == null) {
			out = [];
		}
		const object = this.getPublicLayouts();
		for (let key in object) {
			const title = object[key];
			out.push([key, title]);
		}

		return out;
	}

	hasPublicLayout(key) {
		const list = this.getPublicLayouts();

		if (key in list) {
			return true;
		}

		return false;
	}

	getAllowedPaths() {
		return this.allowedPaths;
	}

	getPathAliases() {
		return this.pathAliases;
	}

	getMockData() {
		return {
			page: {},

			content: 'Mock',

			pageRow: {},

			isAllowEdit: true,

			// category layout
			categoryFilters: {
				filters: [],
				category: {
					url: '/'
				}
			},

			// checkout layout
			step: 'Mock'
		};
	}
}