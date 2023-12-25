import Form from '../../../../modules/form/index';

export default class CategoriesForm extends Form {
	getRules() {
		return [
			['is_published', 'safe'],
			['category_id', 'safe'],
		];
	}

	setupAttrsByRecord() {
		let attrs = {
			//@ts-ignore
			is_published: (['published', 'draft'].indexOf(this.record.status) != -1) ? '1' : ''
		};

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {is_published, category_id} = this.getSafeAttrs();

		await this.getRecord();
		//@ts-ignore
		this.record.set({
			status: is_published == '1' ? 'published' : 'hidden'
		});
		//@ts-ignore
		await this.record.save();

		//@ts-ignore
		await this.getModel('productCategoryRel').setProductCategories(
			//@ts-ignore
			this.record.product_id,
			category_id
		);
	}
}