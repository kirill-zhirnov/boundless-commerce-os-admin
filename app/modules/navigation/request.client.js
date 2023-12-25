import Answer from '../controller/response/answer';
import ajax from '../ajax/kit.client';
import {clientRegistry} from '../registry/client/client.client';
import {hit} from '../analytics/index.client';
import bundles from '../utils/bundles.client';
import extend from 'extend';
import $ from 'jquery';

export default class NavigationRequest {
	constructor(config = {}) {
		this.config = extend(true, {
			layout: '#layout',
			content: '#content',
			header: '#header',
			ajaxHeaders: {
				'X-C-Nav': 1
			}
		}, config);

//		last requested url
		this.url = null;

		/**
		 * @type {null|Answer}
		 */
		this.answer = null;

//		Instance of Request for initial request.
//		It needs to receive access to xhr and check headers.
		this.ajaxRequest = null;

		this.isAborted = false;

		this.completed = false;
	}

	async run(url, pushState = true) {
		$(document).trigger('beforeRequest.cNav');

		clientRegistry.getView().setGlobalViewData(null);

		this.startLoading();
		try {
			await this.makeRequest(url);
			const event = $.Event('beforeProcessResponse.cNav');
			const eventData = {
				response: this.answer,
				navRequest: this,
				pushState
			};

			this.getLayoutEl().trigger(event, [eventData]);

			//push state may be changed in event listeners:
			({pushState} = eventData);

			if (!event.isDefaultPrevented()) {
				await this.processResponse(url, pushState);
				this.getLayoutEl().trigger('requestCompleted.cNav', [this.answer, this]);
			}

			this.endLoading();
		} catch (e) {
			if (this.answer) {
				await this.processResponse(url, pushState);
				this.endLoading();
			} else {
				this.endLoading();

				if (e === 'emptyResponse') {
					return;
				} else {
					throw e;
				}
			}
		}
	}

	async makeRequest(url) {
		this.url = url;

		try {
			const result = await this.makeAjaxRequest(url);
			if (Object.keys(result).length === 0) {
				throw 'emptyResponse';
			}

			await this.processRawResponse(result);
		} catch (e) {
			if (e === 'emptyResponse')
				throw e;

			await this.processRawResponse(e);
		}
	}

	async processRawResponse(result) {
		if (Object.keys(result).length > 0) {
			this.answer = Answer.unSerialize(result);
		}

		if (this.answer) {
			await this.loadBundles();
		} else {
			throw 'emptyResponse';
		}
	}

	wasVersionChanged() {
		const header = this.ajaxRequest.getXhr().getResponseHeader('X-BB-Ver');
		return header && (header !== process.env.VERSION);
	}

	wasThemeChanged() {
		if ($('html').data('theme') !== this.answer.getTheme()) {
			return true;
		}

		return false;
	}

	refreshApp(url) {
		return window.location = url;
	}

	abort() {
		if (!this.completed && !this.isAborted) {
			this.ajaxRequest.abort();
			this.isAborted = true;
			this.endLoading();
		}

		return this;
	}

	shouldRefreshPage() {
		return false;
		// console.log(this.wasVersionChanged());
		// return this.wasVersionChanged() || this.wasThemeChanged();
	}

	async processResponse(requestedUrl, pushState) {
		if (this.shouldRefreshPage()) {
			this.refreshApp(requestedUrl);
			return;
		}

		this.getAnswer().setupGlobalDataInView();

		// const aos = clientRegistry.get('aos');
		// aos.remove();

		await this.replaceHtml();
		const {page} = this.getAnswer();

		if (pushState) {
			history.pushState({}, page.title, requestedUrl);
		}

		this.setTitle(page.title);

		if (this.getAnswer().getType() !== 'layout') {
			this.setHeader(page.header);
		}

		this.setMetaDescription(page.description);
		this.setMetaKeywords(page.keywords);
		this.setPageRobots(page.robots);
		this.updateHtmlAttrs();

		// if (page.aos) {
		// 	aos.init();
		// }

		hit(requestedUrl, this.getAnswer());
	}

	loadBundles() {
		return bundles.all(this.getAnswer().getBundles());
	}

	async replaceHtml() {
		const $layout = this.getLayoutEl();
		if (this.shouldReRenderLayout()) {
//			reset html and verify widgets existence
//			widgets should be remove before new instances will be created (before processLayout)
			$layout.empty();
			clientRegistry.getWidgets().verifyExistence();

//			Show loading only if it is more than 3 sec of waiting.
			let $loading = null;
			const loadingTimer = setTimeout(() => {
					return $loading = $('#re-render-loading').css('display', 'block');
				}
				, 2000);

			const cancelLoading = function () {
				clearTimeout(loadingTimer);

				if ($loading) {
					return $loading.css('display', 'none');
				}
			};

			this.triggerBeforeHtmlProcess();

			try {
				const html = await this.getAnswer().processLayout()
				cancelLoading();
				$layout.replaceWith(html);
			} catch (e) {
				cancelLoading();
				throw e;
			}
		} else {
			const $contentEl = this.getContentEl();
			$contentEl.empty();
			clientRegistry.getWidgets().verifyExistence();

			this.triggerBeforeHtmlProcess();

			const html = await this.getAnswer().processBody();
			$contentEl.html(html);
		}
	}

	triggerBeforeHtmlProcess() {
		return this.getLayoutEl().trigger('beforeHtmlProcess.cNav', [this.answer]);
	}

	shouldReRenderLayout() {
		const $layout = this.getLayoutEl();
		if ($layout.data('layout') !== this.getAnswer().layout.view) {
			return true;
		}

		if ($layout.data('layout-rerender') === true) {
			return true;
		}

		if (this.getAnswer().getType() === 'layout') {
			return true;
		}

//		Fixme: Это костыль для страниц: layout страниц: $pages/pageN - убрать в следующей версии!
//		https://trello.com/c/J4Od9cua/136--
//		if String($layout.data('layout'))[0] == '$'
//			return true

		return false;
	}

	setMetaDescription(description) {
		if (!description) {
			description = '';
		}

		$('meta[name="Description"]').attr('content', description);

		return this;
	}

	setMetaKeywords(keywords) {
		if (!keywords) {
			keywords = '';
		}

		$('meta[name="Keywords"]').attr('content', keywords);

		return this;
	}

	setTitle(title) {
		$('title').text(title);

		return this;
	}

	setHeader(header) {
		$(this.config.header).html(header);

		return this;
	}

	setPageRobots(content) {
		if (content) {
			const $tag = $('head > meta[name="robots"]');

			if ($tag.length > 0) {
				return $tag.attr('content', content);
			} else {
				return $('head').append('<meta name="robots" content="' + content + '" />');
			}
		} else {
			return $('head > meta[name="robots"]').remove();
		}
	}

	updateHtmlAttrs() {
		//@ts-ignore
		const attrs = this.getAnswer().wrapper.data.attrs;
		if (!attrs) {
			return;
		}

		const $htmlEl = $('html');
		for (const [key, val] of Object.entries(attrs)) {
			if ($htmlEl.attr(key) !== val) {
				$htmlEl.attr(key, val);
			}
		}
	}

	getLayoutEl() {
		const $el = $(this.config.layout);

		if ($el.length === 0) {
			throw new Error('Cannot find layout!');
		}

		return $el;
	}

	getContentEl() {
		const $el = $(this.config.content);

		if ($el.length === 0) {
			throw new Error('Cannot find content!');
		}

		return $el;
	}

	makeAjaxRequest(url) {
		this.ajaxRequest = ajax.make(url, {
			headers: this.config.ajaxHeaders,
			type: 'GET'
		});

		return this.ajaxRequest.run();
	}

	getAnswer() {
		return this.answer;
	}

	startLoading() {
		return clientRegistry.getTheme().pageStartLoading();
	}

	endLoading(scrollTop = true) {
		this.completed = true;
		clientRegistry.getTheme().pageEndLoading();

		if (scrollTop) {
			return $('html, body').animate({
				scrollTop: 0
			});
		}
	}
}
