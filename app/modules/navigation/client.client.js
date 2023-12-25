// import {clientRegistry} from '../registry/client/client.client';
import NavigationRequest from './request.client';
import extend from 'extend';
import $ from 'jquery';
import _ from 'underscore';

const hashRegExp = /^#/;
const protocolRegExp = /^[a-z]+:\/\//i;
const mailOrOtherRegExp = /^(mailto|callto|tel):/;

//fixme: response can be without layout and wrapper - here will be an error!

export default class ClientNavigation {
	constructor(config = {}) {
		this.config = extend(true, {
			navigationRequest: {}
		}, config);

		this.callbacks = {
			onBeforeRequestRun: null,
			onBeforeReload: null
		};

//		instance of NavigationRequest
		this.lastRequest = null;
	}

	setup() {
//		Start only if browser supports history API
		if (!this.isHistory()) {
			return;
		}

		$(document).on('click', 'a,[data-c-nav]', _.bind(this.onClick, this));
		$(window).bind('popstate', e => {
			return this.url(`${window.location.pathname}${window.location.search}`, false);
		});

	}

//	isOnlyHashChanged : () ->
//		url = "#{window.location.pathname}#{window.location.search}"
//
//		if @lastRequest
//			if @lastRequest.url == url && window.location.hash != ''
//				return true
//		else
//			if clientRegistry.get('startedUrl') == url && window.location.hash != ''
//				return true
//
//		return false

	onClick(e) {
		let url;
		let $el = $(e.currentTarget);

		if (($el.data('c-nav') === 'off') || ($el.attr('target') === '_blank')) {
			return;
		}

		if (e.ctrlKey || e.shiftKey || e.metaKey || (e.button && (e.button === 1))) {
			return;
		}

		const dataKeys = ['modal', 'modal-close', 'to-basket', 'admin-basket'];
		for (let key = 0; key < dataKeys.length; key++) {
			const val = dataKeys[key];
			if ($el.data(val) !== undefined) {
				return;
			}
		}

		const href = $el.attr('href');
//		if href attr is empty or starts with #,http://,https:// or ftp:// - don't handle it.
		if ((href === '') || protocolRegExp.test(href) || mailOrOtherRegExp.test(href)) {
			return;
		}

		// FIXME: this is a crutch. Check isDefaultPrevented should be used for all events,
		// not only for hash. I have set it only for hash to prevent any bugs before
		// important run.
		let isHash = false;
		if (hashRegExp.test(href)) {
			isHash = true;

			// if default prevented, e.g. by bs-tabs or by any other libs - return.
			if (e.isDefaultPrevented()) {
				return;
			}
		}

		e.preventDefault();

		if (href === '#') {
			return;
		}

		if (isHash) {
			$el = $(href);
			if ($el.length) {
				$('html, body').animate({
					scrollTop: $el.offset().top
				});
			}

			return;
		}

		if (href) {
			url = href;
		} else {
			url = $el.data('c-nav');
		}

		if (url) {
			return this.url(url);
		}
	}

	reload(options = {}) {
		const params = {
			url: `${window.location.pathname}${window.location.search}`,
			pushState: false
		};

		if (this.callbacks.onBeforeReload && _.isFunction(this.callbacks.onBeforeReload)) {
			this.callbacks.onBeforeReload.call(this, params);
		}

		if (this.isHistory() && (!options || !options.nativeReload)) {
			return this.url(params.url, params.pushState);
		} else {
			window.location.reload();

			return Promise.resolve(false);
		}
	}

	async url(url, pushState = true) {
		if (this.isHistory()) {
			this.makeRequest();

			const params = {
				url,
				pushState
			};

			if (this.callbacks.onBeforeRequestRun && _.isFunction(this.callbacks.onBeforeRequestRun)) {
				this.callbacks.onBeforeRequestRun.call(this, params, this.lastRequest);
			}

//		catch an exception to don't have it in browser console
			await this.lastRequest.run(params.url, params.pushState);
			return true;
		} else {
			window.location = url;
			return false;
		}
	}

	setLocation(location) {
		window.location = location;
	}

	isHistory() {
		return !!(window && window.history && history.pushState);
	}

	makeRequest() {
		if (this.lastRequest) {
			this.lastRequest.abort();
		}

		this.lastRequest = this.createRequest();

		return this.lastRequest;
	}

	createRequest() {
		return new NavigationRequest(this.config.navigationRequest);
	}

	setCallback(name, clb) {
		this.callbacks[name] = clb;

		return this;
	}

//	replaces URl in browser and adds it to history.
	pushState(url, title = null, state = {}) {
		if (!title) {
			({title} = document);
		}

		if (this.isHistory()) {
			return history.pushState(state, title, url);
		}
	}
}