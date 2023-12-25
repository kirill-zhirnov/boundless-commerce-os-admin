import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class MainPageSeo extends Form {
	constructor(options) {
		super(options);

		this.mainPageSettings = null;
	}

	getRules() {
		return [
			[
				'title, description, keywords, resetMain',
				'safe'
			]
		];
	}

	async save() {
		return;
		// if (this.mainPageSettings.mainPage) {
		// 	await this.saveSeoInStaticPage();
		// } else {
		// 	await this.saveSeoInSettings();
		// }
	}

	async saveSeoInStaticPage() {
		await this.getModel('pageProps').update({
			custom_title: this.getSafeAttr('title'),
			meta_description: this.getSafeAttr('description'),
			meta_keywords: this.getSafeAttr('keywords')
		}, {
			where: {
				page_id: this.mainPageSettings.mainPage
			}
		});

		if (String(this.getSafeAttr('resetMain')) === '1') {
			this.mainPageSettings.mainPage = null;
			this.triggerClient('url.eIframe', {url: this.url('/')});

			await this.getRegistry().getSettings().set('cms', 'mainPage', this.mainPageSettings);
		}
	}

	async saveSeoInSettings() {
		_.extend(this.mainPageSettings, _.pick(this.getSafeAttrs(), [
			'title', 'description', 'keywords'
		])
		);

		await this.getRegistry().getSettings().set('cms', 'mainPage', this.mainPageSettings);
	}

	async setup() {
		const val = await this.getRegistry().getSettings().get('cms', 'mainPage');

		const data = Object.assign({}, val);
		this.mainPageSettings = Object.assign({}, val);

		if (data.mainPage != null) {
			const page = await this.getModel('page').findOne({
				include: [
					{
						model: this.getModel('pageProps')
					}
				],
				where: {
					page_id: data.mainPage,
					lang_id: this.getEditingLang().lang_id,
					site_id: this.getEditingSite().site_id
				}
			});
			if (page) {
				_.extend(data, {
					//@ts-ignore
					mainPageTitle: page.title,
					//@ts-ignore
					title: page.pageProp.custom_title || page.title,
					//@ts-ignore
					description: page.pageProp.meta_description,
					//@ts-ignore
					keywords: page.pageProp.meta_keywords
				});
			}
		}
		_.defaults(data, {
			title: '',
			description: '',
			keywords: ''
		});


		this.setAttributes(data);
	}
}