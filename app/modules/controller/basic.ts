import FrontController, {TInstanceSession} from './front';
import utils from '../utils/common.client';
import errors from '../errors/errors';
import Answer from './response/answer';
import ExtendedSequelize from '../db/sequelize';
import ExtendedModel, {ExtendedModelCtor} from '../db/model';
import onEssenceChanged from '../../packages/system/modules/onEssenceChanged';
import {create as createEnv} from '../env';
import {IEnv} from '../../@types/env';
import State from '../state';
import JedExtended from '../i18n/jed.client';
import extend from 'extend';
import pathAlias from 'path-alias';
import BasicForm, {IFormOptions} from '../form';
import FormKit, {IFormKitConfig} from './helpers/formKit';
import FormsGroup, {IFormsGroupConfig, TFormsList} from './helpers/formsGroup';
import BasicDataProvider from '../dataProvider';
import {ILang} from '../../@types/countryLang';
import {IServerClientRegistry} from '../../@types/registry/serverClientRegistry';
import {IParsedRoute} from '../../@types/router/serverRouter';
import {IUser} from '../../@types/user';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import Widget, {WidgetCtor} from '../widget/widget.client';
import {IWidgetOptions} from '../../@types/widget';

const viewPathRegExp = /^(\/{0,2})(.+)$/i;

export default class BasicController {
	protected isInternal: boolean = false;
	protected action: string;
	protected answer: Answer;
	protected viewData = {};
	protected layout: string | null;
	protected systemPart: string = 'frontend';
	protected htmlClasses: string[] = [];
	protected bodyAttrs: {[key: string]: string} = {};

	constructor(
		protected parsedRoute: IParsedRoute,
		protected frontController: FrontController
	) {
		this.answer = new Answer({
			requestEnvironment: this.frontController.getRequestEnvironment()
		});

		this.setLayout('default');
		this.addBundle('clientUI');

		if (this.getUser().hasManagersRole()) {
			this.addBundle('admin');
		}

		this.init();
	}

	init() { }

	async runAction(): Promise<Answer> {
		const action = this.getAction();
		if (!action)
			throw new errors.HttpError(404, 'Page not found', this.parsedRoute);

		await this.beforeAction();
		await this[action]();
		await this.afterAction();

		return this.answer;
	}

	getAction(): string | undefined {
		if (this.action)
			return this.action;

		for (const action of this.getActionNames()) {
			if (typeof (this[action]) === 'function') {
				this.action = action;
				break;
			}
		}

		return this.action;
	}

	setIsInternal(isInternal: boolean) {
		this.isInternal = isInternal;
		return this;
	}

	//	Returns an Array with possible name for given method/Action
	//	Array will be sorted by priority. First name with method prefix, then common name, e.g.:
	//	['postActionUser', 'actionUser'] - where "post" is the method name.
	getActionNames() {
		const out = [];

		const actionName = utils.ucfirst(this.parsedRoute.action);
		if (this.parsedRoute.method != null) {
			out.push(`${this.parsedRoute.method.toLowerCase()}Action${actionName}`);
		}

		out.push(`action${actionName}`);

		return out;
	}

	beforeAction() {
	}

	afterAction() {
		this.setupAttrsInResponse();
	}

	setupAttrsInResponse() {
		const htmlAttrs: {lang: string, id?: string, class?: string} = {
			lang: this.getLang().code
		};

		const {htmlClasses} = this;
		htmlClasses.push(this.systemPart);

		//		if layout is not null and it has not already been set directly - set
		//		it in response.
		if (this.layout && !this.answer.layout.view) {
			this.answer.setLayoutView(this.layout);
		}

		if (this.answer.layout.view) {
			htmlAttrs.id = `layout-${this.answer.layout.view.replace('/', '-')}`;
		}

		if (this.answer.page.aos) {
			htmlClasses.push('aos-on');
		}

		if (!this.getUser().isGuest()) {
			const leftSideBar = this.getUser().getSetting('leftSideBar', 'full');
			this.getAnswer().addGlobalViewData({
				leftSideBar
			});

			if (leftSideBar === 'short') {
				htmlClasses.push('is-short-menu');
			}
		}


		htmlAttrs.class = htmlClasses.join(' ');

		this.answer.setWrapperData('attrs', htmlAttrs);
		this.answer.setWrapperData('bodyAttrs', this.bodyAttrs);

		const user = this.getUser();
		this.getAnswer().addGlobalViewData({
			user: {
				roles: user.getRoles(),
				isAdmin: user.isAdmin(),
				email: this.getUser().isGuest() ? null : user.getState('profile') && user.getState('profile').email
			}
		});
	}

	setResponseType(type) {
		this.answer.setType(type);

		return this;
	}

	resolve() {
		console.warn('Using "resolve" method is deprecated');
	}

	reject(error) {
		console.warn('Using "reject" method is deprecated');
		throw error;
	}

	getBasket() {
		return this.getClientRegistry().getBasket();
	}

	getEditingSite() {
		return this.getClientRegistry().getEditingSite();
	}

	getInstanceRegistry(): IInstanceRegistry {
		return this.frontController.getInstanceRegistry();
	}

	getFrontController(): FrontController {
		return this.frontController;
	}

	getParsedRoute(): IParsedRoute {
		return this.parsedRoute;
	}

	getSite() {
		return this.getClientRegistry().getSite();
	}

	getReqBody() {
		return this.frontController.getReqBody();
	}

	getSession(): TInstanceSession {
		return this.frontController.getRequest().session;
	}

	getCookies() {
		return this.frontController.getRequest().cookies;
	}

	getParam(name, defaultVal = null) {
		if (this.parsedRoute.params && name in this.parsedRoute.params) {
			return this.parsedRoute.params[name];
		}

		if (this.frontController.getQuery() && name in this.frontController.getQuery()) {
			return this.frontController.getQuery()[name];
		}

		if (name in this.getReqBody()) {
			return this.getReqBody()[name];
		}

		return defaultVal;
	}

	isPostMethod(): boolean {
		return this.getFrontController().getRequest().method === 'POST';
	}

	isSubmitted(formName = null): boolean {
		if (this.isPostMethod()) {
			if (formName && formName in this.getReqBody()) {
				return true;
			} else if (formName === null) {
				return true;
			}
		}

		return false;
	}

	isXHR(): boolean {
		return this.getFrontController().getRequest().xhr;
	}

	//	url can be:
	//	String - in this case will be redirected directly to 'url'
	//	Array - in this case url will be passed to router.url as arguments.
	//	E.g. @redirect(['path-or-alias', {param:'val'}])
	//	for more information see doc: @modules/router/basic.client.coffee -> url
	redirect(url, status = null) {
		if (Array.isArray(url)) {
			// eslint-disable-next-line prefer-spread
			url = this.url.apply(this, url);
		}

		this.answer.redirect(url, status);
	}

	modalRedirect(url) {
		if (Array.isArray(url)) {
			// eslint-disable-next-line prefer-spread
			url = this.url.apply(this, url);
		}

		this.answer.modalRedirect(url);
	}

	//	Difference between redirect and metaRedirect:
	//	- metaRedirect does not resolve promise
	//	- it needs for e.g. popups: when you need send some command to popup
	// 	in main JSON and have redirect in background.
	metaRedirect(url) {
		if (Array.isArray(url)) {
			// eslint-disable-next-line prefer-spread
			url = this.url.apply(this, url);
		}

		this.answer.setMetaAction('redirect');
		this.answer.setMetaData(url);
	}

	metaReload(options = {}) {
		this.answer.setMetaAction('reload');
		this.answer.setMetaData(options);
	}

	metaLocationRedirect(options = {}) {
		this.answer.setMetaAction('locationRedirect');
		return this.answer.setMetaData(options);
	}

	metaModal(url) {
		if (Array.isArray(url)) {
			// eslint-disable-next-line prefer-spread
			url = this.url.apply(this, url);
		}

		this.answer.setMetaAction('modalRedirect');
		this.answer.setMetaData(url);
	}

	url(urlPath, params = {}, isAbsolute = false): string {
		return this.getInstanceRegistry().getRouter().url(urlPath, params, isAbsolute);
	}

	getResponse(): Answer {
		console.warn('Using getResponse is outdated, use getAnswer instead.');

		return this.answer;
	}

	getAnswer(): Answer {
		return this.answer;
	}

	rejectHttpError(status: number, message: string) {
		throw new errors.HttpError(status, message);
	}

	getDb(): ExtendedSequelize {
		return this.getInstanceRegistry().getDb();
	}

	getModel<M extends ExtendedModel = ExtendedModel>(name): ExtendedModelCtor<M> {
		return this.getDb().model(name) as unknown as ExtendedModelCtor<M>;
	}

	chooseTitle(isNew, newTitle, editTitle): string {
		if (isNew) {
			return newTitle;
		} else {
			return editTitle;
		}
	}

	async getSetting(group: string, key: string) {
		const settings = this.getInstanceRegistry().getSettings();

		return await settings.get(group, key);
	}

	async setSetting(group: string, key: string, value: any) {
		const settings = this.getInstanceRegistry().getSettings();

		return settings.set(group, key, value);
	}

	async essenceChanged(essence: string, idList: number[] = [], action: string = 'change') {
		return onEssenceChanged.trigger(this.getInstanceRegistry(), essence, idList, action);
	}

	addGlobalViewData(data: {}) {
		this.answer.addGlobalViewData(data);

		return this;
	}

	getClientRegistry(): IServerClientRegistry {
		return this.frontController.getClientRegistry();
	}

	getUser(): IUser {
		return this.getClientRegistry().getUser();
	}

	getLang(): ILang {
		return this.getClientRegistry().getLang();
	}

	getEditingLang(): ILang {
		return this.getClientRegistry().getEditingLang();
	}

	async getEnv(): Promise<IEnv> {
		return createEnv(this.getInstanceRegistry())
			.setClientRegistry(this.getClientRegistry())
			.setSession(this.getSession())
			.setCookies(this.getCookies())
			.getEnv();
	}

	async createState(): Promise<State> {
		return new State(await this.getEnv());
	}

	getI18n(): JedExtended {
		return this.getClientRegistry().getI18n();
	}

	__(key: string, variables: string[] = []): string {
		return this.getI18n().__(key, variables);
	}

	p__(...args): string {
		return this.getI18n().p__(...args);
	}

	addAlert(alert: string, type: string): BasicController {
		this.answer.addMetaAlert(alert, type);

		return this;
	}

	alertSuccess(alert: string): BasicController {
		return this.addAlert(alert, 'success');
	}

	alertInfo(alert: string): BasicController {
		return this.addAlert(alert, 'info');
	}

	alertWarning(alert: string): BasicController {
		return this.addAlert(alert, 'warning');
	}

	alertDanger(alert: string): BasicController {
		return this.addAlert(alert, 'danger');
	}

	json(json: {} | boolean | string | any[]): void {
		this.answer.json(json);
	}

	jsonErrors(json: {} | boolean | string) {
		this.answer.json(json);
		this.answer.setStatus(400);
	}

	render(tpl: string, data: {} = {}, localRender: boolean = false): void {
		data = extend(data, this.viewData);

		const viewPath = this.getViewPath(tpl);

		if (localRender) {
			console.error('Render: returnPromise is deprecated, use localRender instead.');
			throw new Error('Render: returnPromise is deprecated, use localRender instead.');
			// return this.frontController.getRequestEnvironment().localRender(
			// 	viewPath.type,
			// 	viewPath.path,
			// 	data,
			// 	viewPath.package
			// );
		}

		this.answer.tpl(viewPath, data);
	}

	setPage(...args) {
		//@ts-ignore
		this.answer.setPage(...args);

		return this;
	}

	modal(tpl, data = {}, title = null, modalWidgetPath = null, settings = {}) {
		if (title) {
			//@ts-ignore
			settings.setTitle = [title];
		}

		this.answer.modal({
			tpl: this.getViewPath(tpl),
			data,
			path: modalWidgetPath,
			settings
		});
	}

	widget(name: string, data = {}, returnPromise = false) {
		if (returnPromise) {
			console.error('Render: returnPromise is deprecated, use localRender instead.');
			throw new Error('Render: returnPromise is deprecated, use localRender instead.');
			// return this.getRequestEnvironment().widget(name, data);
		}

		this.answer.widget(name, data);
	}

	html(data: string) {
		this.answer.setType('html');
		this.answer.setData(data);
	}

	triggerClient(event: string, data: {[key: string]: any} | null = null) {
		if (!Array.isArray(this.answer.ajaxMeta.events))
			this.answer.ajaxMeta.events = [];

		this.answer.ajaxMeta.events.push([event, data]);

		return this;
	}

	//	Tpl can be:
	//	'about' - path relative to current controller: packagesPath/view/controllerName/ + tpl
	//	'/about' - path relative to current package: packagesPath/view + tpl
	//	'//views/about' - path relative to application root: app/ + tpl
	getViewPath(tpl): {type: string, package: null | string, path: null | string} {
		const result = tpl.match(viewPathRegExp);

		if ((result == null)) {
			throw new Error('Tpl path can started with \'/\', \'//\' or name.');
		}

		if (result[1] === '//') {
			return {
				type: 'file',
				package: null,
				path: result[2]
			};
		}

		const out = {
			type: 'controller',
			package: this.parsedRoute.package,
			path: null
		};

		if (result[1] === '/') {
			out.path = result[2];
		} else {
			const path = [];

			if (this.parsedRoute.pathPrefix) {
				path.push(this.parsedRoute.pathPrefix);
			}

			path.push(this.parsedRoute.controller);
			path.push(tpl);

			out.path = path.join('/');
		}

		return out;
	}

	getIsInternal(): boolean {
		return this.isInternal;
	}

	isFrontend(): boolean {
		return this.systemPart === 'frontend';
	}

	getSystemPart(): string {
		return this.systemPart;
	}

	getView() {
		return this.frontController.getView();
	}

	getAuthResource(): {resource: string, task: string | undefined} {
		let resource = [this.parsedRoute.package];

		if (this.parsedRoute.pathPrefix) {
			resource = resource.concat(this.parsedRoute.pathPrefix.split('/'));
		}

		resource.push(this.parsedRoute.controller);

		return {
			resource: resource.join(':'),
			task: this.getAction()
		};
	}

	createForm(path: string, options: Partial<IFormOptions> = {}): BasicForm {
		const requireResult = require(pathAlias.resolve(path));
		const Constructor = requireResult.default ? requireResult.default : requireResult;

		options = extend(true, {
			controller: this
		}, options);

		return new Constructor(options);
	}

	createFormKit(form, formOptions: Partial<IFormOptions> = {}, kitOptions: Partial<IFormKitConfig> = {}) {
		return new FormKit(
			this,
			Object.assign({form, options: formOptions}, kitOptions)
		);
	}

	createFormsGroup(forms: TFormsList, config: Partial<IFormsGroupConfig> = {}): FormsGroup {
		return new FormsGroup(this, forms, config);
	}

	async createDataProvider(path: string, options: Partial<IFormOptions> = {}, attributes: {[key: string]: any} = {}): Promise<BasicDataProvider> {
		const dataProvider = this.createForm(path, options) as unknown as BasicDataProvider;
		dataProvider.setAttributes(Object.assign({}, this.frontController.getQuery(), attributes));
		await dataProvider.setup();

		return dataProvider;
	}

	async getDataProviderData(path: string, options: Partial<IFormOptions> = {}, attributes: {[key: string]: any} = {}) {
		const dataProvider = await this.createDataProvider(path, options, attributes);
		return dataProvider.getData();
	}

	setLayout(layout: string) {
		this.answer.setLayoutView(layout);

		return this;
	}

	setLayoutData(key: string, val: any) {
		this.answer.setLayoutData(key, val);

		return this;
	}

	addBundle(bundle: string) {
		const clientRegistry = this.getClientRegistry();
		const bundles = clientRegistry.getBundles();

		if (!bundles.includes(bundle)) {
			bundles.push(bundle);
		}

		clientRegistry.setBundles(bundles);

		return this;
	}

	makeWidget(widget: string | WidgetCtor, options: IWidgetOptions = {}): Widget {
		return this.frontController.makeWidget(widget, options);
	}
}