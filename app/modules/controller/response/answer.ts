import _ from 'underscore';
import extend from 'extend';
import serializer from '../../../modules/serializer.client';
import {IRequestEnvironment} from '../../../@types/requestEnvironment';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';
import {IAnswerLayout} from '../../../@types/answer';

export default class Answer {
	public body = {
//			layout - @body is empty, instead of it - render layout. if layout is the same - re-render it.
//			It needs for main page, $pages - where all content is in layout, not in response.
		type: 'html', // json|html|redirect|tpl|widget|modalRedirect|modal|layout
		view: null,
		data: null,
		status: null
	};

	public layout: IAnswerLayout = {
		view: null,
		data: {}
	};

	public wrapper = {
		view: 'main',
		data: {}
	};

	public page = {
		title: null,
		header: null,
		keywords: null,
		description: null,
		robots: null,
		aos: null
	};

	public globalViewData = {};

	public requestEnvironment: IRequestEnvironment;

//		we need lang & bunles to send it to client side
	public lang = null;
	public bundles = [];

//		if true - response will be output with Express server.
//		Sometimes you need to turn off output with express and make it manually
// 		(special headers or big files output, etc)
//
//		It does not have any influence if it is internal request
	public performWithExpress: boolean = true;

//		This is additional info, which may sent with ajax response.
//		On client side, special handler can process these directives.
//		Ultimate component receives cleared response, without meta.
	public ajaxMeta = {
		action: null,
		alerts: null,
		events: null,
		data: null,
//			see comment for @setPreventDefault
		preventDefault: false
	};

	public theme = null;

	constructor(options = {}) {
		_.extend(this, _.pick(options, [
				'body',
				'layout',
				'wrapper',
				'page',
				'performWithExpress',
				'requestEnvironment',
				'lang',
				'ajaxMeta',
				'bundles',
				'theme',
				'globalViewData'
			])
		);

		if (!process.env.__IS_SERVER__ && !this.requestEnvironment) {
			const RequestEnvironment = require('../request/environment.client').default;
			this.requestEnvironment = new RequestEnvironment;
		}
	}

	async make() {
		this.setupGlobalDataInView();

		const result = this.hasLayout() ? await this.processWrapper() : await this.processBody();
		this.clearGlobalDataInView();

		return result;
	}

	async processBody() {
		switch (this.body.type) {
			case 'tpl':
				return this.requestEnvironment.localRender(
					this.body.view.type,
					this.body.view.path,
					this.body.data,
					this.body.view.package
				);

			case 'widget':
				return this.requestEnvironment.widget(this.body.view, this.body.data);

			default:
				return this.body.data;
		}
	}

	async processLayout() {
		if (_.indexOf(['html', 'tpl', 'widget', 'layout'], this.body.type) === -1)
			throw new Error(`Cannot render layout for type '${this.body.type}'.`);

		if (!this.hasLayout())
			throw new Error('Layout is empty. Cannot process!');

		this.setLayoutData('content', await this.processBody());

		this.setLayoutData('layout', this.layout.view);
		this.setLayoutData('page', this.page);

		return this.renderLayout();
	}

	renderLayout() {
		return this.requestEnvironment.localRender('layout', this.layout.view, this.layout.data);
	}

	async processWrapper() {
		if (!this.wrapper.view)
			throw new Error('Wrapper is empty. Cannot process!');

		const layoutHtml = await this.processLayout();

		_.extend(this.wrapper.data, {
			'content': layoutHtml,
			'page': this.page,
			'layout': this.layout.view,
			'theme': this.theme,
			'ajaxMeta': this.ajaxMeta,
			'currentMenuUrl': this.layout.data.currentMenuUrl
		});

		return this.renderWrapper();
	}

	renderWrapper() {
		return this.requestEnvironment.localRender('file', `wrappers/${this.wrapper.view}`, this.wrapper.data);
	}

	setupGlobalDataInView() {
		return this.requestEnvironment.getView()
			.setGlobalViewData(this.globalViewData);
	}

	clearGlobalDataInView() {
		return this.requestEnvironment.getView().setGlobalViewData(null);
	}

	setType(type: string) {
		this.body.type = type;

		return this;
	}

	setData(data) {
		this.body.data = data;

		return this;
	}

	setDataKey(key, val) {
		if (!this.body.data) {
			this.body.data = {};
		}

		this.body.data[key] = val;

		return this;
	}

	setView(view) {
		this.body.view = view;

		return this;
	}

	setStatus(status) {
		this.body.status = status;

		return this;
	}

	hasLayout(): boolean {
		return !!this.layout.view;
	}

	setLayoutView(layout) {
		this.layout.view = layout;

		return this;
	}

	setLayoutData(key, val) {
		this.layout.data[key] = val;

		return this;
	}

	getLayout() {
		return this.layout;
	}

	setPerformWithExpress(val) {
		this.performWithExpress = !!val;

		return this;
	}

	getPerformWithExpress() {
		return this.performWithExpress;
	}

	setWrapperData(key, val) {
		this.wrapper.data[key] = val;

		return this;
	}

	getWrapper() {
		return this.wrapper;
	}

	setPage(key, value) {
		// eslint-disable-next-line prefer-rest-params
		if (_.size(arguments) === 2) {
			this.page[key] = value;
		} else {
			for (const i in this.page) {
				// eslint-disable-next-line prefer-rest-params
				if (i in arguments[0]) {
					// eslint-disable-next-line prefer-rest-params
					this.page[i] = arguments[0][i];
				}
			}
		}

		return this;
	}

	setTheme(theme) {
		this.theme = theme;
		return this;
	}

	redirect(url, status = null) {
		this.setType('redirect');
		this.setData(url);

		if (status) {
			this.setStatus(status);
		}

		return this;
	}

	modalRedirect(url) {
		this.setType('modalRedirect');
		this.setData(url);

		return this;
	}

	modal(data) {
		this.setType('modal');
		this.setData(data);

		return this;
	}

	json(data) {
		this.setType('json');
		this.setData(data);

		return this;
	}

	tpl(tpl, data) {
		this.setType('tpl');
		this.setView(tpl);
		this.setData(data);

		return this;
	}

	widget(widget, data) {
		this.setType('widget');
		this.setView(widget);
		this.setData(data);

		return this;
	}

	getStatus() {
		return this.body.status;
	}

	getType(): string {
		return this.body.type;
	}

	getData() {
		return this.body.data;
	}

	getRequestEnvironment(): IRequestEnvironment {
		return this.requestEnvironment;
	}

	setRequestEnvironment(requestEnvironment: IRequestEnvironment) {
		this.requestEnvironment = requestEnvironment;

		return this;
	}

	setMetaAction(action) {
		if (_.indexOf(['redirect', 'locationRedirect', 'modalRedirect', 'reload'], action) === -1) {
			throw new Error('Action is not in allowed list!');
		}

		this.ajaxMeta.action = action;

		return this;
	}

	setMetaAlerts(alerts) {
		this.ajaxMeta.alerts = alerts;

		return this;
	}

	addMetaAlert(alert, type) {
		if ((this.ajaxMeta.alerts == null)) {
			this.ajaxMeta.alerts = [];
		}

		this.ajaxMeta.alerts.push({text: alert, type});

		return this;
	}

	setMetaData(data) {
		this.ajaxMeta.data = data;

		return this;
	}

	// see app/modules/controller/helper/ajaxAnswer::makeJson() to understand why we need it
	setMetaPreventDefault(val) {
		this.ajaxMeta.preventDefault = !!val;

		return this;
	}

	getAjaxMeta() {
		return this.ajaxMeta;
	}

	getLang() {
		return this.lang;
	}

	getBundles() {
		return this.bundles;
	}

	getTheme() {
		return this.theme;
	}

	addGlobalViewData(data) {
		_.extend(this.globalViewData, data);

		return this;
	}

	getGlobalViewData() {
		return this.globalViewData;
	}

//	serialize response to use at client-side
	serialize() {
		const out = {
			body: extend(true, {}, this.body),
			layout: extend(true, {}, this.layout),
			page: extend(true, {}, this.page),
			wrapper: extend(true, {}, this.wrapper),
//			set lang in response - it needs for client side
			lang: null,
			theme: this.theme,
			globalViewData: this.globalViewData,
			bundles: []
		};

		if (this.requestEnvironment) {
			const clientRegistry = this.requestEnvironment.getClientRegistry() as IServerClientRegistry;
			out.lang = clientRegistry.getLang();
			out.bundles = clientRegistry.getBundles();
		}

		out.body.data = serializer.serialize(out.body.data);
		out.layout.data = serializer.serialize(out.layout.data);
		//@ts-ignore
		out.layout.wrapper = serializer.serialize(out.wrapper.data);

		return out;
	}

	static unSerialize(serialized): Answer {
		serialized.body.data = serializer.unSerialize(serialized.body.data);
		serialized.layout.data = serializer.unSerialize(serialized.layout.data);
		serialized.wrapper.data = serializer.unSerialize(serialized.wrapper.data);

		return new Answer(serialized);
	}
}