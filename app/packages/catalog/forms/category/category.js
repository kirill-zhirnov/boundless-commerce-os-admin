import CategoryBasicForm from './basic';
import _ from 'underscore';

export default class MainCategoryForm extends CategoryBasicForm {
	getRules() {
		return [
			['title', 'required']
		];
	}

	setupAttrsByRecord() {
		let attrs = {};

		//@ts-ignore
		Object.assign(attrs, _.pick(this.record.categoryTexts[0], [
			'title'
		]));

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {title} = this.getSafeAttrs();
		//@ts-ignore
		const {category_id} = await this.getRecord();
		const {lang_id} = this.getEditingLang();

		await this.getModel('categoryText').update({
			title
		}, {
			where: {
				category_id,
				lang_id
			}
		});
	}

	async getTplData(...args) {
		//@ts-ignore
		let data = await super.getTplData(...args);

		//@ts-ignore
		data.status = this.record.status;

		// let totalProducts = await this.countProducts();
		// data.sortProducts = (totalProducts > 0) ? true : false;

		return data;
	}

	setupChildFormKit(childFormKit) {
		childFormKit.setPk(this.pk);
		childFormKit.setOptions({
			record: this.record
		});

		return;
	}

	onFormsGroupSaved() {
		return this.triggerCategoryChanged();
	}
}