import _ from 'underscore';
import punycode from 'punycode';
import {ISitesByHost, ISite} from '../../../@types/site'; //eslint-disable-line
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry'; //eslint-disable-line

export default class SiteDetector {
	static initClass() {
		this.CACHE_KEY = 'sites';
	}

	/**
	 * @param {IInstanceRegistry} registry
	 */
	constructor(registry) {
		this.registry = registry;
		this.cache = this.registry.getCache();
		this.db = this.registry.getDb();
	}

	/**
	 * @param {string} hostname
	 * @returns {Promise<ISite>}
	 */
	async getSite(hostname) {
		const sites = await this.getSites();
		console.log('--- sites:', sites);
		const keys = Object.keys(sites);
		console.log('--- keys:', keys);
		//hardcoded, we don;t need it for now:s
		return sites[keys[0]];

		// if (hostname in sites) {
		// 	return sites[hostname];
		// }
		//
		// const foundHostname = this.findSiteByAliases(sites, hostname);
		// if (foundHostname !== false)
		// 	return sites[foundHostname];
		//
		// throw new Error(`Site '${hostname}' is not found in sites!`);
	}

	/**
	 * @returns {Promise<ISitesByHost>}
	 */
	async getSites() {
		return this.cache.load(SiteDetector.CACHE_KEY, async () => await this.loadSitesFromDb());
	}

	/**
	 * @returns {Promise<ISitesByHost>}
	 */
	async loadSitesFromDb() {
		const rows = await this.db.sql(`
			select
				site_id,
				host,
				settings,
				aliases,
				system_host,
				country_id,
				c.code as country_code,
				lang_id,
				l.code as lang_code,
				is_default,
				point_id
			from
				site
			inner join site_country_lang using(site_id)
			inner join country c using(country_id)
			inner join lang l using(lang_id)
			inner join point_sale using(site_id)
		`);
		/**
		 * @type {ISitesByHost}
		 */
		const sites = {};

		for (const row of rows) {
			let settings;
			//@ts-ignore
			const siteHost = punycode.toASCII(row.host);
			if (!(siteHost in sites)) {
				//@ts-ignore
				settings = row.settings || {};

				sites[siteHost] = {
					//@ts-ignore
					site_id: row.site_id,
					//@ts-ignore
					host: row.host,
					//@ts-ignore
					point_id: row.point_id,
					settings: _.defaults(settings, {
						langUrlPrefix: false // may be: false, "lang-country", "lang"
					}),
					//@ts-ignore
					aliases: row.aliases,
					//@ts-ignore
					system_host: row.system_host,
					validUrlPrefix: [],
					default: {
						lang: null,
						country: null,
						urlPrefix: null
					}
				};

				this.validateSiteSettings(sites[siteHost].settings);
			}

			const site = sites[siteHost];
			//@ts-ignore
			if (row.is_default) {
				site.default = {
					//@ts-ignore
					lang: row.lang_id,
					//@ts-ignore
					country: row.country_id,
					urlPrefix: false
					// urlPrefix: this.getUrlPrefixByRow(site.settings.langUrlPrefix, row)
				};
			}

			const urlPrefix = this.getUrlPrefixByRow(site.settings.langUrlPrefix, row);

			if (urlPrefix) {
				site.validUrlPrefix.push;
			}
		}

		return sites;
	}

	getUrlPrefixByRow(langUrlPrefix, row) {
		switch (langUrlPrefix) {
			case false:
				return false;

			case 'lang-country':
				return `${row.lang_code}-${row.country_code}`;

			case 'lang':
				return row.lang_code;

			default:
				throw new Error(`Unknown case '${langUrlPrefix}'`);
		}
	}

	validateSiteSettings(settings) {
		if (!_.isObject(settings)) {
			throw new Error('Setting is not an object');
		}

		if ((settings.langUrlPrefix !== false) && (['lang-country', 'lang'].indexOf(settings.langUrlPrefix) === -1)) {
			throw new Error(`langUrlPrefix has invalid value '${settings.langUrlPrefix}'.`);
		}
	}

	/**
	 * @param {ISitesByHost} sites
	 * @param {string} hostname
	 * @returns {string|false}
	 */
	findSiteByAliases(sites, hostname) {
		for (let host in sites) {
			const val = sites[host];
			if (Array.isArray(val.aliases) && val.aliases.includes(hostname)) {
				return host;
			}
		}

		return false;
	}

	async refreshCache() {
		await this.cache.remove(SiteDetector.CACHE_KEY);
		return this.getSites();
	}
}

SiteDetector.initClass();
