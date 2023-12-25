import {IShortCountry} from '../../../@types/countryLang';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export default class Countries {
	/**
	 * @param {IInstanceRegistry} registry
	 */
	constructor(registry) {
		this.registry = registry;
		this.cache = this.registry.getCache();
		this.db = this.registry.getDb();
	}

	async getCountryByLang(siteId, langId) {
		const data = await this.getData();

		if (data.siteLangs[siteId] && data.siteLangs[siteId][langId] && data.siteLangs[siteId][langId][0]) {
			return data.countries[data.siteLangs[siteId][langId][0]];
		}

		throw new Error(`No country with combination site-lang: '${siteId}'-${langId}.`);
	}

	async getCountryByCode(code) {
		const data = await this.getData();

		if (code in data.codes) {
			return data.countries[data.codes[code]];
		}

		throw new Error(`No country with code '${code}'`);
	}

	/**
	 * @param {string|number} id
	 * @returns {Promise<IShortCountry>}
	 */
	async getCountryById(id) {
		const data = await this.getData();

		if (id in data.countries) {
			return data.countries[id];
		}

		throw new Error(`No country with id '${id}'`);
	}

	async getData() {
		return this.cache.load('countries', async () => await this.loadDataFromDb());
	}

	async loadDataFromDb() {
		const rows = await this.db.sql('\
select \
c.country_id, \
c.code, \
sc.site_id, \
sc.lang_id \
from \
country c \
left join site_country_lang sc using(country_id)\
');

		const out = {
			countries: {},
			codes: {},
			siteLangs: {}
		};

		for (const row of rows) {
			//@ts-ignore
			if (!(row.country_id in out.countries)) {
				//@ts-ignore
				out.countries[row.country_id] = {
					//@ts-ignore
					country_id: row.country_id,
					//@ts-ignore
					code: row.code
				};

				//@ts-ignore
				out.codes[row.code] = row.country_id;
			}

			//@ts-ignore
			if (!(row.site_id in out.siteLangs)) {
				//@ts-ignore
				out.siteLangs[row.site_id] = {};
			}

			//@ts-ignore
			if (!(row.lang_id in out.siteLangs[row.site_id])) {
				//@ts-ignore
				out.siteLangs[row.site_id][row.lang_id] = [];
			}

			//@ts-ignore
			out.siteLangs[row.site_id][row.lang_id].push(row.country_id);
		}

		return out;
	}
}