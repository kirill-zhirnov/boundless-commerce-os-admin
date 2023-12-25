import ClientRegistry from './registry/client/server';
import I18nKit from './i18n/kit/server';
import Locale from './locale';
import SiteDetector from '../packages/system/modules/siteDetector';
import Langs from '../packages/system/modules/langs';
// import Settings from '../packages/system/modules/settings';
// import Cache from './cache/index';
import Router from './router/router';
import {wrapperRegistry} from './registry/server/classes/wrapper';
import UniqueId from './uniqueId.client';
import InstanceExporter from './instanceSync/exporter';
import {IEnv} from '../../app/@types/env'; //eslint-disable-line

class Creator {
	constructor(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.clientRegistry = null;
		this.session = {};
		this.cookies = {};
	}

	setClientRegistry(clientRegistry) {
		this.clientRegistry = clientRegistry;

		return this;
	}

	setSession(session) {
		this.session = session;

		return this;
	}

	setCookies(cookies) {
		this.cookies = cookies;

		return this;
	}

	/**
	 * @returns {Promise<IEnv>}
	 */
	async getEnv() {
		await this.setupInstanceRegistry();
		await this.setupClientRegistry();

		return {
			instanceRegistry: this.instanceRegistry,
			clientRegistry: this.clientRegistry,
			session: this.session,
			cookies: this.cookies
		};
	}

	async setupInstanceRegistry() {
		// if (!this.instanceRegistry.has('cache'))
		// 	await this.setupCache();

		// if (!this.instanceRegistry.has('settings'))
		// 	this.instanceRegistry.setSettings(new Settings(this.instanceRegistry));

		if (!this.instanceRegistry.hasCurrency())
			await this.setupCurrency();
	}

	async setupCurrency() {
		const cache = this.instanceRegistry.getCache();
		const db = this.instanceRegistry.getDb();

		const currency = await cache.load('currency', () => db.model('currency').bootstrapDefaultCurrency(this.instanceRegistry));
		this.instanceRegistry.setCurrency(currency);
	}

	// async setupCache() {
	// 	const cache = new Cache(wrapperRegistry.getConfig().cache, this.instanceRegistry);
	// 	await cache.warmUp();
	//
	// 	this.instanceRegistry.setCache(cache);
	// }

	async setupClientRegistry() {
		if (!this.clientRegistry)
			this.clientRegistry = new ClientRegistry();

		if (!this.clientRegistry.hasI18n())
			this.clientRegistry.setI18n(new I18nKit().createDefaultI18n());

		if (!this.clientRegistry.hasLocale())
			await this.setupDefaultLocale();

		if (!this.clientRegistry.hasSite())
			await this.setupDefaultSite();

		if (!this.clientRegistry.hasLang())
			await this.setupLang();

		if (!this.clientRegistry.hasRouter())
			this.setupDefaultRouter();

		if (!this.clientRegistry.hasUniqueId())
			this.clientRegistry.setUniqueId(new UniqueId());

		if (!this.clientRegistry.hasInstanceExporter())
			this.clientRegistry.setInstanceExporter(new InstanceExporter());
	}

	async setupLang() {
		const langs = new Langs(this.instanceRegistry);
		const site = this.clientRegistry.getSite();

		const lang = await langs.getLangById(site.default.lang);
		this.clientRegistry.setLang(lang);
	}

	async setupDefaultSite() {
		const siteDetector = new SiteDetector(this.instanceRegistry);
		const sites = await siteDetector.getSites();

		//since now we have only one site per instance - just set first one:
		this.clientRegistry.setSite(sites[Object.keys(sites)[0]]);
	}

	async setupDefaultLocale() {
		const value = await this.instanceRegistry.getSettings().get('system', 'locale');

		this.clientRegistry.setLocale(new Locale({
			formatMoneyOptions: value.money,
			phone: value.phone,
			formatDateOptions: value.date,
			currency: this.instanceRegistry.getCurrency().alias,
			i18n: this.clientRegistry.getI18n()
		}));
	}

	setupDefaultRouter() {
		const router = new Router(Object.assign({}, wrapperRegistry.getConfig().router, {
			baseUrl: this.instanceRegistry.getInstanceInfo().base_url
		}));

		this.clientRegistry.setRouter(router);
	}
}

export function create(instanceRegistry) {
	return new Creator(instanceRegistry);
}