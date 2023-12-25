import $ from 'jquery';
import JadeDecorator from '../jade/decorator/basic.client';
import ajax from '../ajax/kit.client';
import _  from 'underscore';
// import {clientRegistry} from '../registry/client/client.client';

export default class ViewRenderer {
	constructor(config, globalViewData = null) {
		this.globalViewData = globalViewData;
		this.config = $.extend({
			url: '',
			urlBundle: ''
		}, config);

		this.cache = {};
	}

//	see BasicRenderer.localRender for explanation.
	localRender(type, file, data = {}, packageName = null) {
		return this.getTpl(type, file, packageName)
			.then(tpl => this.compileTpl(tpl, data))
			// .catch(e => console.error(e))
		;
	}

	/**
	 * @param tpl
	 * @param data
	 * @returns {Promise<string>}
	 */
	compileTpl(tpl, data) {
		if (this.globalViewData) {
			data = _.extend({}, this.globalViewData, data);
		}

		const obj = new JadeDecorator(data);
		return obj.render(tpl);
	}

	async getTpl(type, file, packageName = null) {
		const packagePrefix = this.preparePackageName(packageName);

		if (this.cache[packagePrefix]?.[type]?.[file]) {
			return this.cache[packagePrefix]?.[type]?.[file];
		}

		const data = await ajax.get(this.config.url, {type, file, packageName, version: process.env.VERSION});
		const tpl = this.prepareCompiledMethod(data.tpl);

		if (tpl) {
			this.putTplInCache(type, file, packagePrefix, tpl);
			return tpl;
		} else {
			throw new Error(`Cannot compile tpl ${file}`);
		}
	}

	loadBundle(bundle) {
		//prevent using cache with POST:
		return ajax.get('/getTplBundle', {version: process.env.VERSION, bundle}, {hidden: true})
			.then(tpls => {
				if (Array.isArray(tpls)) {
					for (const item of tpls) {
						const tpl = this.prepareCompiledMethod(item.tpl);

						if (tpl) {
							this.putTplInCache(item.type, item.file, this.preparePackageName(item.packageName), tpl);
						}
					}
				}
			});
	}

	preparePackageName(packageName) {
		if (packageName != null) {
			return packageName;
		} else {
			return '_all';
		}
	}

	putTplInCache(type, file, packagePrefix, tpl) {
		if ((this.cache[packagePrefix] == null)) {
			this.cache[packagePrefix] = {};
		}

		if ((this.cache[packagePrefix][type] == null)) {
			this.cache[packagePrefix][type] = {};
		}

		this.cache[packagePrefix][type][file] = tpl;

		return this;
	}

	prepareCompiledMethod(methodAsString) {
		try {
			let out;
			eval(`out = ${methodAsString}`);
			//@ts-ignore
			if (!_.isFunction(out)) {
				return false;
			}
			//@ts-ignore
			return out;
		} catch (e) {
			console.error('prepareCompiledMethod:', e);
			return false;
		}
	}

	setGlobalViewData(globalViewData) {
		this.globalViewData = globalViewData;
		return this;
	}

	getGlobalViewData(key, defaultVal = null) {
		if (_.isObject(this.globalViewData) && key in this.globalViewData) {
			return this.globalViewData[key];
		}

		return defaultVal;
	}

	clearCache() {
		return this.cache = {};
	}

	clearTplsInCache(changedTpls) {
		for (const tpl of changedTpls) {
			const packagePrefix = this.preparePackageName(tpl.packageName);

			if (this.cache[packagePrefix]?.[tpl.type]?.[tpl.file]) {
				delete this.cache[packagePrefix][tpl.type][tpl.file];
			}
		}
	}
}