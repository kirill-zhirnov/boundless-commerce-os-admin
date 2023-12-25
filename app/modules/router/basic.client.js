import _ from 'underscore';
// const ajax = require('../ajax/kit.client');

let clientRegistry;
if (!process.env.__IS_SERVER__) {
	clientRegistry = require('../registry/client/client.client').clientRegistry;
}

export default class BasicRouter {
	constructor(config) {
		this.config = _.extend({
			amp: '&',
			baseUrl: '',
			importUrl: ''
		}, config);

		this.routes = {};
		this.methods = {};
		this.paths = {};
		this.aliases = {};

		this.namedParamRegExp = /:\w+/gi;
		this.urlRegExp = /^(?:(get|post|put|delete|head|options)(?:\s+))?(@?)(.+)$/i;
		this.aliasRegExp = /@/;
	}

//	path could be:
//	- "some/path" (front / is not necessary)
//	- "post some/path" - could have prefix with method. Route will be looked only for given method
//	- "@some-alias" - aliased path
//	- "post @some-alias" - aliased path with method

	// langCountry = null, frontController = null
	url(urlPath, params = {}, isAbsolute = false) {
		const result = urlPath.match(this.urlRegExp);

		const method = (result[1] != null) ? result[1].toUpperCase() : null;
		const isAlias = result[2] === '@' ? true : false;
		let path = result[3];

		if (isAlias && (this.aliases[path] != null)) {
			path = this.aliases[path];
		}

		const route = this.findRouteByPath(path, params, method);

		let skipParams = [];
		if (route) {
			path = this.getUrlByOriginalRoute(route.orig, params);
			skipParams = route.params;
		}

		path = path === '/' ? path : `/${path}`;
		// we don't use lang prefix anymore
		// path = `${this.getLangPrefix(langCountry, frontController)}${path}`;

		const getStr = this.createGetStr(params, skipParams);
		if (getStr !== '') {
			path += `?${getStr}`;
		}

		if (isAbsolute) {
			path = `${this.config.baseUrl}${path}`;
		}

		return path;
	}

	createGetStr(params, skipRoot = [], prefix = '') {
		const out = [];

		const isArray = _.isArray(params);

		_.each(params, (val, key) => {
			let name;
			if (_.indexOf(skipRoot, key) !== -1) {
				return;
			}

			if (prefix !== '') {
				name = !isArray ? `${prefix}[${key}]` : `${prefix}[]`;
			} else {
				name = key;
			}

			if (_.isObject(val) || _.isArray(val)) {
				return out.push(this.createGetStr(val, [], name));
			} else {
				if (val === null) {
					val = '';
				}

				val = encodeURIComponent(val);
				return out.push(`${name}=${val}`);
			}
		});

		return out.join(this.config.amp);
	}

//	originalRoute - string, e.g.: ":category/:product"
//	params - {}, e.g.: {category: 'socks', product: 'red-one'}
	getUrlByOriginalRoute(originalRoute, params) {
		return originalRoute.replace(this.namedParamRegExp, paramName => {
			const param = this.getNamedParamName(paramName);

			if (params[param] != null) {
				return params[param];
			} else {
				return paramName;
			}
		});
	}

	findRouteByPath(path, params = {}, method = null) {
		if ((this.paths[path] == null)) {
			return false;
		}

		for (let key in this.paths[path]) {
			const routeId = this.paths[path][key];
			const route = this.routes[routeId];

//			validate route methods
			if ((route.where.methods != null) && ((method == null) || (_.indexOf(route.where.methods, method) === -1))) {
				continue;
			}

			if ((method != null) && (route.where.methods == null)) {
				continue;
			}

//			validate params
			if (!this.validateRouteParamsForUrl(route, params)) {
				continue;
			}

//			all checks passed - return route
			return route;
		}

//		route not found
		return false;
	}

//	I decided not to use it for current moment:
//
//	- RegExp - if export to client side - we need to parse imported array on init
// (if string is regExp or function). Export callbacks to client is also not
// so good idea - it may have a dependencies, which would not work on client side.
//
//	Of cource I can use lazy init for RegExp, but on other side - I don't think that
// It really needs.
//
//	If it needs in future - I can add it.
//
//
	validateRouteParamsForUrl(route, params) {
		for (let paramName of Array.from(route.params)) {
//			Does param exist?
			if ((params[paramName] == null)) {
				return false;
			}
		}

//#			Validate params
//			paramValue = params[paramName]
//			if route.where.params? && route.where.params[paramName]?
//				whereValue = route.where.params[paramName]
//
//				if _.isRegExp(whereValue)
//					if not whereValue.test(paramValue)
//						return false
//				else if _.isFunction(whereValue)
//					if not whereValue(paramValue)
//						return false

		return true;
	}

//	cut front ":" from paramName
//	for example: ":category" -> "category"
	getNamedParamName(param) {
		return param.substr(1);
	}

	import(data) {
		this.routes = data.routes;
		this.paths = data.paths;
		this.aliases = data.aliases;

		return this;
	}

	getLangPrefix(langCountry = null, frontController = null) {
//		lets allow work without langCountry and frontController
		if (process.env.__IS_SERVER__ && (frontController == null)) {
			return '';
		}

		const clientRegistry = this.getClientRegistry(frontController);
		const site = clientRegistry.getSite();

		if (!site.settings.langUrlPrefix || (langCountry === false)) {
			return '';
		}

		if ((langCountry == null)) {
			langCountry = {
				lang: clientRegistry.getLang().code,
				country: clientRegistry.getCountry().code
			};
		}

		switch (site.settings.langUrlPrefix) {
			case 'lang-country':
				if (!('lang' in langCountry) || !('country' in langCountry)) {
					throw new Error('langCountry object should have keys lang and country with codes!');
				}

				return `/${langCountry.lang}-${langCountry.country}`;

			case 'lang':
				if (!('lang' in langCountry)) {
					throw new Error('langCountry object should have keys lang and country with codes!');
				}

				return `/${langCountry.lang}`;

			default:
				throw new Error('Unknown prefix mode');
		}
	}

	getClientRegistry(frontController) {
		if (process.env.__IS_SERVER__) {
			if (!frontController) {
				throw new Error('You must pass frontController before calling this func!');
			}

			return frontController.getClientRegistry();
		} else {
			return clientRegistry;
		}
	}

	setConfig(config) {
		_.extend(this.config, config);

		return this;
	}
}
