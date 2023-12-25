import _ from 'underscore';
import BasicRouter from './basic.client';
import {IParsedRoute} from '../../@types/router/serverRouter';

export default class Router extends BasicRouter {
	constructor(config = {}) {
		super(config);

		_.extend(this.config, {
			defaultRoute: 'system/index/index'
		}, config);

		this.pathRegExp = /^([^/?]+)\/((?:[^/?]+\/)*)([^/?]+)\/([^/?]+)$/i;
	}

	/**
	 * @param {string} path
	 * @param {string|null} method
	 * @returns {false|IParsedRoute}
	 */
	parse(path, method = null) {
		path = this.normalizePath(path);
		method = (method != null) ? method.toUpperCase() : null;

		const foundRoute = this.findRoute(path, method);

		if (foundRoute) {
			path = foundRoute.route.to;
		}

		const parsedPath = this.parseRoute(path);

		if (parsedPath) {
			parsedPath.method = method;
			parsedPath.originalPath = path;

			if (foundRoute) {
				parsedPath.params = foundRoute.params;
			} else {
				parsedPath.params = null;
			}

			//@ts-ignore
			return parsedPath;
		} else {
			return false;
		}
	}

//	fromRoute - string with route: :category/:product or some-permanent-url
//	to - where to map it, for example: users/role/list
//	where - object to restrict route, for example:
// 	{
//		methods : ['get', 'post']
//		params : {
//			category : /^\d+$/ - if regExp or callback - will be validated
//			product : 5 - if scalar - will be returned as param
//		}
//	}
	addRoute(fromRoute, to, where = null) {
		const regExp = this.routeToRegExp(fromRoute);

		where = this.prepareRouteWhere(where);
		const route = {
			orig: fromRoute,
			regExp: new RegExp(regExp, 'i'),
			regExpSource: regExp,
			params: this.extractNamedParams(fromRoute),
			to,
			where
		};

		const routeKey = _.size(this.routes);
		this.routes[routeKey] = route;
		this.putRouteKeyToPath(to, routeKey);

		if (where.methods != null) {
			for (let method of Array.from(where.methods)) {
				this.putRouteKeyToMethod(method, routeKey);
			}
		}

		return this;
	}

//	routes - Array with routes, e.g.:
//	[
//		{from: ':category/action', to: 'some', where : {}}
//	]
	addRoutes(routes) {
		for (let route of Array.from(routes)) {
			this.addRoute(route.from, route.to, route.where);
		}

		return this;
	}

//	add alias for creating link
	addAlias(alias, to) {
		if (this.aliasRegExp.test(alias)) {
			throw new Error('Alias cannot contain "@".');
		}

		this.aliases[alias] = to;

		return this;
	}

//	aliases - Array with aliases, e.g.:
//	[
//		{alias:'some', to:'path'}
// 	]
	addAliases(aliases) {
		for (let alias of Array.from(aliases)) {
			this.addAlias(alias.alias, alias.to);
		}

		return this;
	}

//	prepare RegExp string by given route
//	returns string for RegExp constructor
	routeToRegExp(route) {
		route = `^${route.replace(this.namedParamRegExp, '([^/?]+)')}$`;

		return route;
	}

	extractNamedParams(route) {
		const result = route.match(this.namedParamRegExp);

		const params = [];
		if (result != null) {
			for (let param of Array.from(result)) {
				params.push(this.getNamedParamName(param));
			}
		}

		return params;
	}

	putRouteKeyToPath(to, routeKey) {
		if ((this.paths[to] == null)) {
			this.paths[to] = {};
		}

		this.paths[to][routeKey] = routeKey;

		return this;
	}

	putRouteKeyToMethod(method, routeKey) {
		if ((this.methods[method] == null)) {
			this.methods[method] = {};
		}

		this.methods[method][routeKey] = routeKey;

		return this;
	}

	prepareRouteWhere(where) {
		const out = {
			methods: [],
			params: {}
		};

		if (where != null) {
//			validate methods
			const validMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
			if ((where.methods != null) && _.isArray(where.methods)) {
				for (let method of Array.from(where.methods)) {
					method = method.toUpperCase();
					if (validMethods.indexOf(method) === -1) {
						throw new Error(`Method '${method}' does supported!`);
					}

					out.methods.push(method);
				}
			}

//			validate params
			const validTypes = ['string', 'number', 'function'];
			if (where.params != null) {
				for (let param in where.params) {
					const value = where.params[param];
					if ((validTypes.indexOf(typeof (value)) === -1) && !_.isRegExp(value)) {
						throw new Error(`Param '${param}' must be string/number or function/RegExp`);
					}

					out.params[param] = value;
				}
			}
		}

		if (out.methods.length === 0) {
			out.methods = null;
		}

		if (_.size(out.params) === 0) {
			out.params = null;
		}

		return out;
	}

	parseRoute(path) {
		if (path === '') {
			path = this.config.defaultRoute;
		}

		const result = path.match(this.pathRegExp);

		if (result != null) {
			const out = {};
			out.package = result[1];
			out.pathPrefix = result[2].substr(0, (result[2].length - 1));
			out.controller = result[3];
			out.action = result[4];

			return out;
		} else {
			return false;
		}

//			Do not convert routes to lower case, since URL should be case-sensitive:
//           http://stackoverflow.com/questions/7996919/should-url-be-case-sensitive
//
//			convert to lower-case
//			for key, value of out
//				if key != 'action'
//					out[key] = value.toLowerCase()
	}

	findRoute(path, method) {
		for (let key in this.routes) {
			const route = this.routes[key];
			const params = this.validateRoute(route, path, method);

			if (!params) {
				continue;
			}

			return {
				params,
				route
			};
		}

		return false;
	}

	validateRoute(route, path, method) {
		if (route.where.methods) {
			if ((method && (route.where.methods.indexOf(method) === -1)) || !method) {
				return false;
			}
		}

		const regExpResult = path.match(route.regExp);

		if (regExpResult) {
			let param;
			const out = {};
			for (let key = 0; key < route.params.length; key++) {
				param = route.params[key];
				let paramValue = regExpResult[key + 1];

				if ((route.where.params != null) && (route.where.params[param] != null)) {
					const whereValue = route.where.params[param];

					if (_.isRegExp(whereValue)) {
						if (!whereValue.test(paramValue)) {
							return false;
						}
					} else if (_.isFunction(whereValue)) {
						if (!whereValue(paramValue)) {
							return false;
						}
					} else {
						paramValue = whereValue;
					}
				}

				out[param] = paramValue;
			}

//			lets add custom params
			if (route.where.params != null) {
				for (param in route.where.params) {
					const value = route.where.params[param];
					if (route.params.indexOf(param) === -1) {
						out[param] = value;
					}
				}
			}

			return out;
		} else {
			return false;
		}
	}

	normalizePath(path) {
//		cut front slash
		path = path.replace(/^\//, '');

//		cut trailing slash
		path = path.replace(/\/$/, '');

		return path;
	}

//	prepare object to export to client-side
//	at client-side we need only data for creating urls
	exportToClient() {
		const out = {
			routes: {},
			paths: this.paths,
			aliases: this.aliases
		};

//		export to client only necessary data
		for (let key in this.routes) {
			const value = this.routes[key];
			out.routes[key] = {
				orig: value.orig,
				params: value.params,
				to: value.to,
				where: this.prepareWhereToExport(value.where, value.params)
			};
		}

		return out;
	}

	prepareWhereToExport(where, usedParams = []) {
		const out = {methods: where.methods};

		return out;
	}

//		I decided not to export RegExp or callbacks for function creates.
// 		Also I removed this feature from url func.
//		See comment at: basic.client.coffee:107
//
//		if not where.params?
//			return out
//
//		outParams = {}
//		for paramName, paramVal of where.params
//			if usedParams.indexOf(paramName) == -1 || !_.isString(paramVal)
//				continue
//
//			outParams[paramName] = paramVal
//
//		if _.size(outParams) > 0
//			out.params = outParams
//
//		return out

	getClientConfig() {
		return _.pick(this.config, ['importUrl', 'baseUrl']);
	}

	setBaseUrl(baseUrl) {
		this.config.baseUrl = baseUrl;

		return this;
	}
}