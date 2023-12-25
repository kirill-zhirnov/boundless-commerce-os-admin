import Locale from '../../modules/locale';
import JedExtended from '../../modules/i18n/jed.client';
import {ISite} from '../site';
import {IShortCountry, ILang} from '../countryLang';
import UniqueId from '../../modules/uniqueId.client';
import InstanceExporter from '../../modules/instanceSync/exporter';
import WidgetsRegistry from '../../modules/registry/client/widgets.client';
import ClientCache from '../../modules/cache/client.client';
import ClientTheme from '../../modules/theme/client.client';
import {IClientConfig} from '../config';
import I18nKit from '../../modules/i18n/kit/basic.client';
import {IClientNavigation} from '../clientNavigation';
import {IImportRegistry} from '../../modules/registry/client/client.client';
import {IBasicRouter} from '../router/router';
import {IView} from '../view';
import {IClientInstanceInfo} from '../instances';
import {IGlobalViewUser} from '../user';

export interface IClientRegistry {
	setLocale: (locale: Locale) => this;
	getLocale: () => Locale;
	hasLocale: () => boolean;

	setI18n: (i18n: JedExtended) => this;
	getI18n: () => JedExtended;
	hasI18n: () => boolean;

	setSite: (site: ISite) => this;
	hasSite: () => boolean;
	getSite: () => ISite;

	setLang: (ILang) => this;
	hasLang: () => boolean;
	getLang: () => ILang;

	setCountry: (country: IShortCountry) => this;
	getCountry: () => IShortCountry;

	setRouter: (router: IBasicRouter) => this;
	hasRouter: () => boolean;
	getRouter: () => IBasicRouter;

	setUniqueId: (val: UniqueId) => this;
	hasUniqueId: () => boolean;
	getUniqueId: () => UniqueId;

	setInstanceExporter: (exporter: InstanceExporter) => this;
	hasInstanceExporter: () => boolean;
	getInstanceExporter: () => InstanceExporter;

	getWidgets: () => WidgetsRegistry;

	setView: (view: IView) => this;
	getView: () => IView;

	getCache: () => ClientCache;

	setTheme: (theme: ClientTheme) => this;
	getTheme: () => ClientTheme;

	setConfig: (config: IClientConfig) => this;
	getConfig: () => IClientConfig;

	setI18nKit: (i18nKit: I18nKit) => this;
	getI18nKit: () => I18nKit;

	getClientNav: () => IClientNavigation;

	setStartedUrl: (url: string) => this;
	getStartedUrl: () => string;

	setInstanceInfo: (info: IClientInstanceInfo) => this;
	getInstanceInfo: () => IClientInstanceInfo;

	import: (data: IImportRegistry) => void;
}