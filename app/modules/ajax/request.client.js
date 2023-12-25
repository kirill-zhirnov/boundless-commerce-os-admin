import _ from 'underscore';
import $ from 'jquery';
import extend from 'extend';

let clientRegistry, modalKit;
if (!process.env.__IS_SERVER__) {
	clientRegistry = require('../registry/client/client.client').clientRegistry;
	modalKit = require('../modal/kit.client').default;
}

export default class Request {
	constructor(url, settings = {}, ajaxKit = null) {
		this.url = url;
		this.ajaxKit = ajaxKit;
		this.id = _.uniqueId('ajaxRequest');
		this.settings = extend(true, {
			hidden: false,
			dataType: 'json',
			success: null
		}, settings);

		this.xhr = null;

		if (Array.isArray(this.url)) {
			if (clientRegistry) {
				const router = clientRegistry.getRouter();
				this.url = router.url.apply(router, this.url);
			} else {
				this.url = '#not-for-server-side';
			}
		}
	}

	run() {
		this.wrapCallbacks();
		this.startLoading();

		return new Promise((resolve, reject) => {
			this.xhr = $.ajax(this.url, _.omit(this.settings, ['hidden']));
			this.xhr
				.done(data => {
					this.endLoading();
					resolve(this.processResponse('success', data));
				})
				.fail(jqXHR => {
					this.endLoading();

					let data = {};
					if ('responseJSON' in jqXHR && _.isObject(jqXHR.responseJSON)) {
						data = jqXHR.responseJSON;
					}

					reject(this.processResponse('error', data));
				})
			;
		});
	}

	abort() {
		return this.xhr.abort();
	}

	processResponse(type, data) {
		let clbData = {};
		if ('d' in data) {
			clbData = data.d;
		}

		if ('m' in data) {
			this.processMeta(data.m, clbData);
		}

		return clbData;
	}

	processMeta(meta, clbData) {
		if ('action' in meta) {
			switch (meta.action) {
				case 'redirect':
					clientRegistry.getClientNav().url(meta.data);
					break;
				case 'reload':
					clientRegistry.getClientNav().reload(meta.data);
					break;
				case 'modalRedirect':
					modalKit.createRemote(meta.data);
					break;
				case 'locationRedirect':
					clientRegistry.getClientNav().setLocation(meta.data);
					break;
				default:
					throw new Error(`Unknown action '${meta.action}'`);
			}
		}

		if (Array.isArray(meta.alerts)) {
			for (const item of meta.alerts) {
				clientRegistry.getTheme().alert(item.text, item.type);
			}
		}

		if (Array.isArray(meta.events)) {
			meta.events.map(
				(event) => $(document).trigger(event[0], [event[1], meta, clbData])
			);
		}
	}

	startLoading() {
		if (this.ajaxKit && !this.settings.hidden) {
			return this.ajaxKit.startLoading(this);
		}
	}

	endLoading() {
		if (this.ajaxKit && !this.settings.hidden) {
			return this.ajaxKit.endLoading(this);
		}
	}

	getId() {
		return this.id;
	}

//	Backbone uses callbacks. Wrap it.
	wrapCallbacks() {
		if (_.isFunction(this.settings.success)) {
			const successOriginal = this.settings.success;
			return this.settings.success = function (data, textStatus, jqXHR) {
				let clbData = {};
				if ('d' in data) {
					clbData = data.d;
				}

				return successOriginal.call(this, clbData, textStatus, jqXHR);
			};
		}
	}

//		no need to wrap error, since it does not have any influence for Backbone.

	getXhr() {
		return this.xhr;
	}
}