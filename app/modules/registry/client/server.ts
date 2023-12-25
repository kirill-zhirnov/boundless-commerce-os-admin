import {ClientRegistry} from './client.client';
import _ from 'underscore';
import ClientCache from '../../cache/client.client';
import {ILang} from '../../../@types/countryLang';
import {wrapperRegistry} from '../server/classes/wrapper';
import {ISite} from '../../../@types/site';
import {IBasket} from '../../../@types/basket';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IUser} from '../../../@types/user';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';

export default class ServerClientRegistry extends ClientRegistry implements IServerClientRegistry {
	protected user: IUser;
	protected widgetsCache: ClientCache;
	protected basket: IBasket;
	protected bundles: string[] = [];

	public setUser(user: IUser) {
		this.user = user;
		return this;
	}

	public getUser(): IUser {
		return this.user;
	}

	public hasUser(): boolean {
		return !_.isUndefined(this.user);
	}

	public setWidgetsCache(cache: ClientCache) {
		this.widgetsCache = cache;
		return this;
	}

	public getWidgetsCache(): ClientCache {
		return this.widgetsCache;
	}

	getEditingLang(): ILang {
		return this.getLang();
	}

	getEditingSite(): ISite {
		return this.getSite();
	}

	setBundles(bundles: string[]) {
		this.bundles = bundles;
		return this;
	}

	getBundles(): string[] {
		return this.bundles;
	}

	setBasket(basket: IBasket) {
		this.basket = basket;
		return this;
	}

	getBasket(): IBasket {
		return this.basket;
	}

	async export(instanceRegistry: IInstanceRegistry) {
		return {
			bundles: this.bundles,
			config: await this.buildConfigForExport(instanceRegistry),
			instanceExporter: this.getInstanceExporter().export(),
			country: this.country,
			lang: this.lang,
			site: this.site,
			instanceInfo: _.pick(instanceRegistry.getInstanceInfo(), ['instance_id', 'tariff_alias', 'tariff_billing_period', 'tariff_amount'])
		};
	}

	async buildConfigForExport(instanceRegistry: IInstanceRegistry) {
		const router = instanceRegistry.getRouter();
		const serverConfig = instanceRegistry.getConfig();
		const version = process.env.VERSION;
		const wrapperConfig = wrapperRegistry.getConfig();
		const s3Storage = {
			mediaServer: wrapperConfig.instanceS3Storage.mediaServer,
			folderPrefix: wrapperConfig.instanceS3Storage.folderPrefix
		};

		const clientConfig = {
			i18nKit: wrapperRegistry.getI18nKit().getClientConfig(),
			router: router.getClientConfig(),
			locale: this.getLocale().getClientConfig(),
			staticServer: _.pick(serverConfig.staticServer, ['protocol', 'host']),
			staticAssetsHost: wrapperConfig.staticAssetsHost,
			analytics: wrapperConfig.analytics,
			s3Storage
		};

		clientConfig.i18nKit.localeUrl = router.url('getLang', {version});
		clientConfig.router.importUrl = router.url('getRoutes', {version});

		return clientConfig;
	}
}