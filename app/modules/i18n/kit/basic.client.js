import Jed from '../jed.client';
import ajax from '../../ajax/kit.client';
import extend from 'extend';

export default class I18nKit {
	constructor(config) {
		this.config = extend(true, {
			localeUrl : ''
		}, config);

		this.cache = {};
	}

	getLocaleData(lang = null) {
		if ((lang == null)) {
			return Promise.resolve(null);
		}

		return Promise.resolve()
			.then(() => {
				if (!(lang in this.cache)) {
					return this.loadLocaleData(lang);
				}
			})
			.then(data => {
				if (data) {
					this.cache[lang] = data;
				}

				return this.cache[lang];
			});
	}

	loadLocaleData(lang) {
		return ajax.post(this.config.localeUrl, {lang}, {hidden : true});
	}

	createI18nCached(lang = null) {
		//@ts-ignore
		return new Jed(this.cache[lang]);
	}

	createI18n(lang = null) {
		return this.getLocaleData(lang)
		.then(locale => {
			let jed;
			if (locale) {
				//@ts-ignore
				jed = new Jed(locale);
			} else {
				jed = this.createDefaultI18n();
			}

			return jed;
		});
	}

	createDefaultI18n() {
		//@ts-ignore
		const jed = new Jed({});

		return jed;
	}

	getClientConfig() {
		return this.config;
	}

	setCachedData(code, data) {
		this.cache[code] = data;

		return this;
	}
}