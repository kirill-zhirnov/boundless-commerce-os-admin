import pathAlias from 'path-alias';
import BasicI18nKit from './basic.client';
import _ from 'underscore';
import fs from 'fs';

export default class ServerI18nKit extends BasicI18nKit {
	loadLocaleData(lang) {
		const dataPath = pathAlias.resolve(`app/i18n/${lang}/messages.json`);
		let data = null;

		if (fs.existsSync(dataPath)) {
			data = require(dataPath);

			const outMsg = {};
			if ((data.locale_data != null ? data.locale_data.messages : undefined) != null) {
				for (let key in data.locale_data.messages) {
					const val = data.locale_data.messages[key];
					if (_.isArray(val) && (!val[0] || (val[0] === ''))) {
						continue;
					}

					outMsg[key] = val;
				}

				data.locale_data.messages = outMsg;
			}
		}

		return data;
	}
}