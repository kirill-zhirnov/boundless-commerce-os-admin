import ProductBasic from './basic';
import helpCatalog from '../../../../modules/help';
import {Op} from 'sequelize';
import FrontEndUrls from '../../../../modules/url/frontendUrls';

export default class ProductSeo extends ProductBasic {
	getRules() {
		return [
			['custom_title, meta_description', 'trim'],
			['url_key', 'required'],
			['url_key', 'urlKey'],
			[
				'url_key',
				'isUnique',
				{
					model: this.getModel('productText'),
					criteria: {
						where: {
							lang_id: this.getEditingLang().lang_id,
							product_id: {
								[Op.ne]: this.pk
							}
						}
					}
				}
			]
		];
	}

	setupAttrsByRecord() {
		//@ts-ignore
		const {custom_title, meta_description, url_key} = this.record.productTexts[0];

		this.setAttributes({
			custom_title,
			meta_description,
			url_key
		});
	}

	async getTplData() {
		const out = await super.getTplData();

		const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());
		const baseUrl = await frontendUrls.getProductBaseUrl() || this.url('@product', {id: ''}, true);

		Object.assign(out, {
			baseUrl,
			help: helpCatalog.get('productWhatIsSeoTitleAndMeta')
		});

		return out;
	}

	async save() {
		//@ts-ignore
		const {url_key, custom_title, meta_description} = this.getSafeAttrs();
		//@ts-ignore
		const productText = this.record.productTexts[0];

		//@ts-ignore
		productText.set({
			url_key,
			custom_title,
			meta_description,
		});

		//@ts-ignore
		await productText.save();
	}
}