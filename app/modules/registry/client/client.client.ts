import JedExtended from '../../i18n/jed.client';
import _ from 'underscore';
import Locale from '../../locale';
import BasicRouter from '../../router/basic.client';
import UniqueId from '../../uniqueId.client';
import InstanceExporter from '../../instanceSync/exporter';
import {ISite} from '../../../@types/site';
import {IShortCountry, ILang} from '../../../@types/countryLang';
import WidgetsRegistry from './widgets.client';
import ViewRenderer from '../../viewRenderer/viewRenderer.client';
import ClientCache from '../../cache/client.client';
import ClientTheme from '../../theme/client.client';
import {IClientConfig} from '../../../@types/config';
import I18nKit from '../../i18n/kit/basic.client';
import {IClientNavigation} from '../../../@types/clientNavigation';
import {IClientRegistry} from '../../../@types/registry/clientRegistry';
import {IClientInstanceInfo} from '../../../@types/instances';
// import {IGlobalViewUser} from '../../../@types/user';

export class ClientRegistry implements IClientRegistry {
	protected i18n: JedExtended;
	protected locale: Locale;
	protected site: ISite;
	protected lang: ILang;
	protected country: IShortCountry;
	protected router: BasicRouter;
	protected uniqueId: UniqueId;
	protected instanceExporter: InstanceExporter;
	protected widgets: WidgetsRegistry;
	protected view: ViewRenderer;
	protected cache: ClientCache;
	protected theme: ClientTheme;
	protected config: IClientConfig;
	protected i18nKit: I18nKit;
	protected clientNav: IClientNavigation;
	protected startedUrl: string;
	protected instanceInfo: IClientInstanceInfo;

	public setLocale(locale: Locale) {
		this.locale = locale;
		return this;
	}

	public getLocale(): Locale {
		return this.locale;
	}

	public hasLocale(): boolean {
		return !_.isUndefined(this.locale);
	}

	public setI18n(i18n: JedExtended) {
		this.i18n = i18n;
		return this;
	}

	public getI18n(): JedExtended {
		return this.i18n;
	}

	public hasI18n(): boolean {
		return !_.isUndefined(this.i18n);
	}

	public setSite(site: ISite) {
		this.site = site;
		return this;
	}

	public hasSite(): boolean {
		return !_.isUndefined(this.site);
	}

	public getSite(): ISite {
		return this.site;
	}

	public setLang(lang: ILang) {
		this.lang = lang;
		return this;
	}

	public hasLang(): boolean {
		return !_.isUndefined(this.lang);
	}

	public getLang(): ILang {
		return this.lang;
	}

	public setCountry(country: IShortCountry) {
		this.country = country;
		return this;
	}

	public getCountry(): IShortCountry {
		return this.country;
	}

	public setRouter(router: BasicRouter) {
		this.router = router;
		return this;
	}

	public hasRouter(): boolean {
		return !_.isUndefined(this.router);
	}

	public getRouter(): BasicRouter {
		return this.router;
	}

	public setUniqueId(val: UniqueId) {
		this.uniqueId = val;
		return this;
	}

	public hasUniqueId(): boolean {
		return !_.isUndefined(this.uniqueId);
	}

	public getUniqueId(): UniqueId {
		return this.uniqueId;
	}

	public setInstanceExporter(exporter: InstanceExporter) {
		this.instanceExporter = exporter;
		return this;
	}

	public hasInstanceExporter(): boolean {
		return !_.isUndefined(this.instanceExporter);
	}

	public getInstanceExporter(): InstanceExporter {
		return this.instanceExporter;
	}

	public getWidgets(): WidgetsRegistry {
		if (!this.widgets) {
			this.widgets = new WidgetsRegistry();
		}

		return this.widgets;
	}

	public setView(view: ViewRenderer) {
		this.view = view;
		return this;
	}

	public getView(): ViewRenderer {
		return this.view;
	}

	public getCache(): ClientCache {
		if (!this.cache) {
			this.cache = new ClientCache();
		}

		return this.cache;
	}

	public setTheme(theme: ClientTheme) {
		this.theme = theme;
		return this;
	}

	public getTheme(): ClientTheme {
		return this.theme;
	}

	public setConfig(config: IClientConfig) {
		this.config = config;
		return this;
	}

	public getConfig(): IClientConfig {
		return this.config;
	}

	public setI18nKit(i18nKit: I18nKit) {
		this.i18nKit = i18nKit;
		return this;
	}

	public getI18nKit(): I18nKit {
		return this.i18nKit;
	}

	public getClientNav(): IClientNavigation {
		if (!this.clientNav) {
			const ClientNavigation = require('../../navigation/client.client').default;
			this.clientNav = new ClientNavigation();
		}

		return this.clientNav;
	}

	public setStartedUrl(url: string) {
		this.startedUrl = url;
		return this;
	}

	public getStartedUrl(): string {
		return this.startedUrl;
	}

	public setInstanceInfo(info: IClientInstanceInfo) {
		this.instanceInfo = info;
		return this;
	}

	public getInstanceInfo(): IClientInstanceInfo {
		return this.instanceInfo;
	}

	public import(data: IImportRegistry): void {
		this.setConfig(data.config);
		this.setCountry(data.country);
		this.setLang(data.lang);
		this.setSite(data.site);
		this.setInstanceInfo(data.instanceInfo);
	}
}

const clientRegistry = new ClientRegistry();

export {clientRegistry};

export interface IImportRegistry {
	config: IClientConfig;
	country: IShortCountry;
	lang: ILang;
	site: ISite;
	instanceInfo: IClientInstanceInfo;
}