import {Collection} from 'backbone';
import MyBackboneView from '../backbone/my/view.client';
import _ from 'underscore';
import Locale from '../locale';
import PageableCollection from 'backbone.paginator';
import JedExtended from '../i18n/jed.client';
import $ from 'jquery';
import MyCollection from '../backbone/my/collection.client';
import commonUtils from '../utils/common.client';
import serializer from '../serializer.client';
import ajax from '../ajax/kit.client';
import {IClientRegistry} from '../../@types/registry/clientRegistry';
import Vue from 'vue';
import pathAlias from 'path-alias';
import {IView} from '../../@types/view';
import {IFrontController} from '../../@types/frontController';
import {IWidgetOptions} from '../../@types/widget';
import {IBasicRouter} from '../../@types/router/router';

let serverUtils, clientRegistry;

if (process.env.__IS_SERVER__) {
	serverUtils = require('../utils/server');
} else {
	clientRegistry = require('../registry/client/client.client').clientRegistry;
}


export default class Widget extends MyBackboneView {
	/**
	 * if true widget will be serialized, exported to client and inited in bootstrap
	 * @protected
	 */
	protected clientExport: boolean = true;
	protected frontController: IFrontController;
	protected package: string;
	protected incomeAttrs: { [key: string]: string | number };
	// protected lazyInit: boolean;
	protected data: { [key: string]: any } = {};
	protected selfInitialized: boolean = false;
	public collection: PageableCollection;
	// public el: HTMLElement;
	public id: string;
	public vues: Vue[] = [];

	constructor(options: IWidgetOptions = {}) {
		super(options);

		_.extend(this, _.pick(options, ['clientExport', 'package', 'frontController', 'data', 'incomeAttrs']));

		if (Array.isArray(this.collection)) {
			//@ts-ignore
			this.collection = MyCollection.createByArray(this.collection);
		}

		this.selfInitialized = true;
		this._ensureElement();

		if (!process.env.__IS_SERVER__) {
			this.registerInWidgets();
		}
	}

	async make() {
		this.registerExternalRels();

		return await this.run();
	}

	run(): Promise<string>|string {
		return this.resolveEmpty();
	}

	runLazyInit(): any {
	}

	resolveEmpty(appendDomReady = null) {
		if ((appendDomReady === null)) {
			appendDomReady = this.isClientExport();
		}

		return this.wrapInWrapper('', appendDomReady);
	}

	//@ts-ignore
	async render(tpl: string, data: { [key: string]: any } = {}, wrapInWrapper: boolean = true, appendDomReady: null | boolean = null): Promise<string> {
		if (appendDomReady === null) {
			appendDomReady = this.isClientExport();
		}

		let html = await this.localRender(tpl, data);

		if (wrapInWrapper) {
			html = this.wrapInWrapper(html, appendDomReady);
		} else if (appendDomReady) {
			html += this.getDomReadySuffix();
		}

		return html;
	}

	async localRender(tpl: string, data: { [key: string]: any } = {}): Promise<string> {
		if (this.package === null)
			throw new Error('You must setup package before calling this func!');

		return this.getView().localRender('widget', tpl, this.prepareTplData(data), this.package);
	}

	async renderToWrapper(tpl: string, data: {[key: string]: any} = {}): Promise<void> {
		const html = await this.localRender(tpl, data);

		if (this.$el) {
			this.$el.html(html);
		}
	}

	async renderAndReplace(tpl, data = {}) {
		if (process.env.__IS_SERVER__) {
			throw new Error('Method for client side');
		}

		const classes = this.$el.attr('class').split(/\s+/);

		const html = await this.localRender(tpl, data);
		if (this.$el) {
			const prevData = this.$el.data();
			this.replace(this.wrapInWrapper(html, false));
			this.$el.data(prevData);

			const editClasses = classes.filter(className => /^editable-/.test(className));
			this.$el.addClass(editClasses.join(' '));

			this.undelegateEvents();
			this.delegateEvents();

//				it doesn't work, see comment at Boss.getBossEvents
//				@$el.trigger('afterRR')

			return true;
		}

		return false;
	}

	getView(): IView {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().getView();
		} else {
			return this.getClientRegistry().getView();
		}
	}

	wrapInWrapper(html: string, appendDomReady = true): string {
		if (appendDomReady) {
			html += this.getDomReadySuffix();
		}

		const wrapper = this.getWrapper();
		wrapper.splice(1, 0, html);

		return wrapper.join('');
	}

	/**
	 * method will be called after widget will be added to DOM.
	 * It needs to set El and bind events.
	 */
	onElReady() {
		if (!this.el) {
			const el = $(`#${this.getId()}`);

			if (el.length === 0) {
				throw new Error(`Cannot find el with ID: '${this.getId()}'`);
			}

			this.setElement(el);
		}

		this.setDataWidgetAttr();
		// if (this.isEditMode()) {
		// 	this.listenTo$(document, 'refreshBlock', (e, eventData) => {
		// 		if (eventData.id === this.getId()) {
		// 			if (eventData.data) {
		// 				this.data = eventData.data;
		// 			}
		//
		// 			return this.refreshBlock(eventData);
		// 		}
		// 	});
		// }

		this.runLazyInit();
	}

	verifyExistence(): boolean {
		if (this.el && !this.isInDom()) {
			this.getClientRegistry().getWidgets().remove(this.getId());
			this.remove();

			return false;
		}

		return true;
	}

	remove() {
		this.$el.data('widget', null);

		for (const vueItem of this.vues) {
			vueItem.$destroy();
		}

		return super.remove();
	}

	_ensureElement() {
		if (!this.selfInitialized)
			return;

//		make sure we have an ID (we will use it in widgets registry):
		if (!this.getId() && ((process.env.__IS_SERVER__ && this.hasFrontController()) || !process.env.__IS_SERVER__)) {
			this.id = this.getClientRegistry().getUniqueId().createId();
		}

//		if client side && el was passed - set it.
		if (this.el) {
			this.setElement(_.result(this, 'el'));
		}
	}

	getPath() {
		const fileName = this.getFileName();

		if (fileName === __filename) {
			throw new Error('You must redefine @getFileName to properly use getPath method!');
		}

		return serverUtils.getPathRelativeToRealRoot(fileName);
	}

	getFileName() {
		return __filename;
	}

	hasFrontController() {
		return !!this.frontController;
	}

	getFrontController(): IFrontController {
		if (process.env.__IS_SERVER__) {
			return this.frontController;
		}
	}

	getClientRegistry(): IClientRegistry {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().getClientRegistry();
		} else {
			return clientRegistry;
		}
	}

	getLocale(): Locale {
		return this.getClientRegistry().getLocale();
	}

	getI18n(): JedExtended {
		return this.getClientRegistry().getI18n();
	}

	__(...args): string {
		return this.getI18n().__(...args);
	}

	p__(...args) {
		return this.getI18n().p__(...args);
	}

	formatMoney(amount, options = {}): string {
		return this.getLocale().formatMoney(amount, options);
	}

	getId(): string {
		return _.result(this, 'id');
	}

	setDataWidgetAttr(): void {
		this.$el.data('widget', this);
	}

	registerInWidgets(): void {
		const id = this.getId();
		const widgets = this.getClientRegistry().getWidgets();
		if (widgets.has(this.getId())) {
			throw new Error(`Widget with id '${id}' has already registered in registry.`);
		}

		widgets.set(id, this);
	}

	isClientExport(): boolean {
		return this.clientExport;
	}

	registerExternalRels() {
		if (process.env.__IS_SERVER__) {
//			if client export - register widget in InstanceSync
			if (this.clientExport && this.hasFrontController()) {
				return this.getClientRegistry().getInstanceExporter().set('widget', this.getId(), this);
			}
		}
	}

	getDomReadySuffix() {
		return `<script type="text/javascript">bb.ready(function(){bb.initWidget('${this.getId()}')})</script>`;
	}

	getWrapper() {
		const tag = _.result(this, 'tagName');
		return [`<${tag} ${commonUtils.buildHtmlAttrsStr(this.compileAttrs())}>`, `</${tag}>`];
	}

	compileAttrs() {
		const attrs = _.extend({}, _.result(this, 'attributes'));
		attrs.id = this.getId();

		if (!attrs.class) {
			attrs.class = '';
		}

		if (this.className) {
			if (attrs.class) {
				attrs.class += ' ';
			}

			attrs.class += _.result(this, 'className');
		}

		if (this.incomeAttrs) {
			_.extend(attrs, _.omit(this.incomeAttrs, ['class']));

			if (this.incomeAttrs.class) {
				if (attrs.class) {
					attrs.class += ' ';
				}

				attrs.class += ' ' + this.incomeAttrs.class;
			}
		}

		return attrs;
	}

	prepareTplData(passedData) {
		const data = Object.assign({}, this.data, passedData);

		if ((this.model != null) && (data.model == null)) {
			data.model = this.model.toJSON();
		}

		if ((this.collection != null) && (data.collection == null)) {
			data.collection = this.collection.toJSON();
		}

		if ((data.id == null)) {
			data.id = this.getId();
		}

		return data;
	}

	makeBbCollection(collection, models = null, options = {}): Collection {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().makeBbCollection(collection, models, options);
		} else {
			if (_.isString(collection)) {
				//@ts-ignore
				collection = pathAlias(collection);

				//@ts-ignore
				if (collection.default) {
					//@ts-ignore
					collection = collection.default;
				}
			}

			return new collection(models, options);
		}
	}

	async makeIsomorphicRequest(url, getParams = {}, method: string = 'get', postData = null) {
		if (process.env.__IS_SERVER__) {
			// try {
				const answer = await this.getFrontController().runInternal(url, method, getParams, postData);
				return answer.getData();
			// } catch (error) {
			// 	return Promise.reject(error.error);
			// }
		} else {
			switch (method) {
				case 'get':
					return ajax.get(url, getParams);
				case 'post':
					return ajax.post(url, postData);
			}
		}
	}

	url(urlPath: string, params: {[key: string]: any} = {}, isAbsolute: boolean = false) {
		return this.getRouter().url(urlPath, params, isAbsolute);
	}

	getRouter(): IBasicRouter {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().getInstanceRegistry().getRouter();
		} else {
			return this.getClientRegistry().getRouter();
		}
	}

	serialize() {
		const out = {
			path: this.getPath(),
			data: _.pick(this, this.getPropsForExport())
		};

		out.data = serializer.serialize(out.data);

		return out;
	}

	getPropsForExport(out: string[] = []) {
		return out.concat([
			'model', 'collection', 'id', 'attributes', 'className', 'tagName',
			'lazyInit', 'package', 'data'
		]);
	}

	getWCache() {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().getClientRegistry().getWidgetsCache();
		} else {
			return this.getClientRegistry().getCache();
		}
	}

	//@ts-ignore
	attributes() {}

	replace(newContent: string|JQuery) {
		const newEl = newContent instanceof $ ? newContent : $(newContent as string);
		this.$el.replaceWith(newEl);
		this.setElement(newEl as unknown as JQuery<HTMLElement>);
	}

	getInstanceRegistry() {
		if (process.env.__IS_SERVER__) {
			return this.getFrontController().getInstanceRegistry();
		}

		throw new Error('Method for server side!');
	}

//	this function will be called  after widget exported at Client Side
//	(so method will be called only at Client side!!!)
	afterCSExport() {}

	isEditMode(): boolean {
		if (process.env.__IS_SERVER__) {
			throw new Error('Method for client side');
		}

		return ['block', 'container', 'section'].includes(this.$el.data('edit'));
	}

	getThemeId() {
		if (!process.env.__IS_SERVER__) {
			// return this.getClientRegistry().getTheme().config.id;
			return null;
		}
	}

	getLayoutEl() {
		return $('#layout');
	}

	getLayoutName() {
		return this.getLayoutEl().data('layout');
	}

	makeVue(config, $tplEl = null): Vue {
		if ($tplEl) {
			throw new Error('Passing $tplEl is deprecated');
		}

		const instance = new Vue(config);

		this.vues.push(instance);

		return instance;
	}

	static unSerialize(data) {
		return new (this)(data);
	}
}

export type WidgetCtor = {
	new (options?: IWidgetOptions): Widget;
}
