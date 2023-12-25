import {ILang} from '../../../@types/countryLang';
import InstanceRegistry from '../../../modules/registry/server/classes/instance';

export default class Langs {
	/**
	 * @param {InstanceRegistry} registry
	 */
	constructor(registry) {
		this.registry = registry;
		this.db = this.registry.getDb();
		this.cache = this.registry.getCache();
	}

	async getLangByCode(code) {
		const data = await this.getData();

		if (code in data.codes) {
			return data.langs[data.codes[code]];
		}

		throw new Error(`No lang with code '${code}'`);
	}

	/**
	 * @param {string|number} id
	 * @returns {Promise<ILang>}
	 */
	async getLangById(id) {
		const data = await this.getData();

		if (id in data.langs) {
			return data.langs[id];
		}

		throw new Error(`No lang with id '${id}'`);
	}

	async getData() {
		return this.cache.load('langs', async () => await this.loadDataFromDb());
	}

	loadDataFromDb() {
		return this.db.sql('\
select \
l.lang_id, \
l.code, \
l.is_backend, \
in_lang_id, \
title \
from \
lang l \
left join lang_title using(lang_id) \
left join lang inLang on inLang.lang_id = in_lang_id\
').then(rows => {
			const data = {
				langs: {},
				codes: {}
			};

			for (const row of rows) {
				//@ts-ignore
				if (!(row.lang_id in data.langs)) {
					//@ts-ignore
					data.langs[row.lang_id] = {
						//@ts-ignore
						lang_id: row.lang_id,
						//@ts-ignore
						code: row.code,
						//@ts-ignore
						is_backend: row.is_backend,
						titles: {}
					};

					//@ts-ignore
					data.codes[row.code] = row.lang_id;
				}

				//@ts-ignore
				if (row.title) {
					//@ts-ignore
					data.langs[row.lang_id].titles[row.in_lang_id] = row.title;
				}
			}

			return data;
		});
	}
}