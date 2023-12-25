import CategoryBasicForm from './basic';
import {Op} from 'sequelize';
import FrontEndUrls from '../../../../modules/url/frontendUrls';

export default class CategorySeoForm extends CategoryBasicForm {
	getRules() {
		return [
			['custom_title, meta_description', 'trim'],
			['url_key', 'required'],
			['url_key', 'urlKey'],
			[
				'url_key',
				'isUnique',
				{
					model: this.getModel('categoryText'),
					criteria: {
						where: {
							lang_id: this.getEditingLang().lang_id,
							category_id: {
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
		const {custom_title, meta_description, url_key} = this.record.categoryTexts[0];

		this.setAttributes({
			custom_title,
			meta_description,
			url_key
		});
	}

	async getTplData() {
		const out = await super.getTplData();

		const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());
		Object.assign(out, {
			baseUrl: await frontendUrls.getCategoryUrlByKey() || this.url('@category', {id: ''}, true)
		});

		return out;
	}

	async save() {
		//@ts-ignore
		const {url_key, custom_title, meta_description} = this.getSafeAttrs();
		//@ts-ignore
		const categoryText = this.record.categoryTexts[0];

		categoryText.set({
			url_key,
			custom_title,
			meta_description,
		});

		await categoryText.save();
	}
}