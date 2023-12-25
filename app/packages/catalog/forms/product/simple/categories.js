const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');

class CategoriesForm extends Form {
	getRules() {
		return [
			['category_id', 'safe'],
		];
	}

	async save() {
		let attrs = this.getSafeAttrs();

		await this.getRecord();

		return this.getModel('productCategoryRel').setProductCategories(
			this.record.product_id,
			attrs.category_id
		);
	}
}

module.exports = CategoriesForm;