import ClientCache from '../../modules/cache/client.client';
import {IShortCountry, ILang} from '../countryLang';
import {ISite} from '../site';
import {IClientRegistry} from './clientRegistry';
import {IUser} from '../user';
import {IInstanceRegistry} from './instanceRegistry';
import {IBasket} from '../basket';

export interface IServerClientRegistry extends IClientRegistry {
	setUser: (user: IUser) => this;
	getUser: () => IUser;
	hasUser: () => boolean;

	setWidgetsCache: (cache: ClientCache) => this;
	getWidgetsCache: () => ClientCache;

	getEditingLang: () => ILang;
	getEditingSite: () => ISite;

	setBundles: (bundles: string[]) => this;
	getBundles: () => string[];

	setBasket: (basket: IBasket) => this;
	getBasket: () => IBasket;

	export: (instanceRegistry: IInstanceRegistry) => Promise<{
		bundles: string[],
		config: {[key: string]: any},
		instanceExporter: {[key: string]: any},
		country: IShortCountry,
		lang: ILang,
		site: ISite
	}>;
}