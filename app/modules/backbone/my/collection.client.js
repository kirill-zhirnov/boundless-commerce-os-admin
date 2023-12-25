import Backbone from 'backbone';
import PageableCollection from 'backbone.paginator';
import _ from 'underscore';
import {backboneUrl} from '../helpers';

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

export default class MyBackboneCollection extends PageableCollection {
	static initClass() {
		//@ts-ignore
		this.prototype.state = {
			firstPage: 1,
			lastPage: null,
			currentPage: NaN,
			pageSize: undefined,
			totalPages: null,
			totalRecords: null,
			sortKey: null,
			order: -1
		};

		//@ts-ignore
		this.prototype.queryParams = {
			currentPage: 'page',
			pageSize: 'perPage',
			totalPages: 'totalPages',
			totalRecords: 'totalEntries',
			sortKey: 'sortBy',
			order: 'order',
			directions: {
				'-1': 'asc',
				'1': 'desc'
			}
		};

		//@ts-ignore
		this.prototype.model = Backbone.My.Model;
	}

	constructor(models, options) {
		super(...arguments);

//		Were models loaded or set?
//		this property needs for @load() method.
		this.modelsAreLoaded = false;

//		We need frontController for internal request (to have same session/user/etc in internal request)
//		it will be passed to Backbone.sync
		this.frontController = null;

		if (options && options.frontController) {
			this.frontController = options.frontController;
		}

//		spike-nail for PageableCollection. I don't want to have any default states at client-side.
//		All default states should be server-side.
		//@ts-ignore
		if (isNaN(this.state.currentPage)) {
			//@ts-ignore
			this.state.currentPage = null;
		}
	}

//	if models were loaded - resolve promise
//	if not - fetch and resolve with models.
	async load(options = {}) {
		if (this.modelsAreLoaded && !options.reset) {
			//@ts-ignore
			return this.models;
		} else {
			//@ts-ignore
			await this.fetch(options);
			//@ts-ignore
			return this.models;
		}
	}

	sync(method, model, options) {
		if (this.frontController != null) {
			options.frontController = this.frontController;
		}

		return super.sync(method, model, options);
	}

	areModelsLoaded() {
		return this.modelsAreLoaded;
	}

	_reset() {
		this.modelsAreLoaded = false;

		return super._reset(...arguments);
	}

	create(model, options) {
		options = options ? _.clone(options) : {};

		//@ts-ignore
		if (!(model = this._prepareModel(model, options))) {
			return false;
		}

		if (!options.wait) {
			//@ts-ignore
			this.add(model, options);
		}

		const collection = this;
		const {
			success
		} = options;

		options.success = function (model, resp) {
			if (options.wait) {
				//@ts-ignore
				collection.add(model, options);
			}

			if (success) {
				return success(model, resp, options);
			}
		};

		return model.save(null, options);
	}

	set(models) {
		if (models) {
			this.modelsAreLoaded = true;
		}

		return super.set(...arguments);
	}

	serialize() {
		return {
			path: utils.getPathRelativeToRealRoot(this.getFileName()),
			//@ts-ignore
			data: this.toJSONAll()
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

//	@url is taken by Backbone
	createUrl(urlPath, params = {}, isAbsolute = false) {
		return backboneUrl(urlPath, params, isAbsolute, this.frontController);
	}

//	method need in Grid to serialize GridStates.
	serializeStates() {
		const out = {};
		for (let state of ['currentPage', 'pageSize', 'sortKey', 'order']) {
			//@ts-ignore
			if (this.state[state]) {
				//@ts-ignore
				let value = this.state[state];

				if (state === 'order') {
					//@ts-ignore
					value = this.queryParams.directions[value];
				}

				//@ts-ignore
				out[this.queryParams[state]] = value;
			}
		}

		const omitKeys = [
			'currentPage', 'pageSize', 'totalPages', 'totalRecords', 'sortKey',
			'order', 'directions'
		];

		//@ts-ignore
		const object = _.omit(this.queryParams, omitKeys);
		for (let key in object) {
			let val = object[key];
			if (_.isFunction(val)) {
				val = val.call(this);
			}

			if ((val != null) && (val !== '')) {
				out[key] = val;
			}
		}

		return out;
	}

	static reqParamsToStates(params, config = {}) {
		config = _.extend({
			//@ts-ignore
			queryParams: this.prototype.queryParams
		}, config);

		const out = {};
		_.each(params, (val, key) => {
			const stateKey = this.getStateKeyByReq(key, config.queryParams);
			let stateVal = null;

			switch (stateKey) {
				case 'order':
					_.each(config.queryParams.directions, (rVal, sVal) => {
						if (val === rVal) {
							return stateVal = sVal;
						}
					});
					break;
				default:
					stateVal = val;
			}

			return out[stateKey] = stateVal;
		});

		return out;
	}

	static getStateKeyByReq(key, queryParams) {
		let out = null;

		_.each(queryParams, (reqKey, stateKey) => {
			if (reqKey === key) {
				return out = stateKey;
			}
		});

		return out;
	}

	static unSerialize(data) {
		//@ts-ignore
		return this.createByArray(data);
	}
}

MyBackboneCollection.initClass();

//@ts-ignore
Backbone.My.Collection = MyBackboneCollection;