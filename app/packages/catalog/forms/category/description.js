import CategoryBasicForm from './basic';
import _ from 'underscore';

export default class CategoryDescriptionForm extends CategoryBasicForm {
	getRules() {
		return [
			['description_top, description_bottom', 'trim']
		];
	}

	setupAttrsByRecord() {
		let attrs = {};

		//@ts-ignore
		Object.assign(attrs, _.pick(this.record.categoryTexts[0], [
			'description_top',
			'description_bottom',
		]));

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {description_top, description_bottom} = this.getSafeAttrs();
		const {lang_id} = this.getEditingLang();

		await this.getModel('categoryText').update({
			description_top,
			description_bottom,
		}, {
			where: {
				category_id: this.pk,
				lang_id
			}
		});
	}
}