import BasicCategoryForm from '../../forms/category/basic';

export default class MoveForm extends BasicCategoryForm {
	getRules() {
		return [
			['siblings', 'required'],
			[
				'parent_id',
				'tree',
				{
					pk: 'category_id',
					row: this.record
				}
			],
		];
	}

	async save() {
		let attrs = this.getSafeAttrs();

		//@ts-ignore
		attrs.parent_id = attrs.parent_id || null;

		const _record = await this.getRecord();
		const record = await this.saveCategoryAttrs(_record, attrs);
		//@ts-ignore
		this.pk = record.category_id;

		//@ts-ignore
		if (!Array.isArray(attrs.siblings))	attrs.siblings = [];

		//@ts-ignore
		await this.getModel('category').updateSort(attrs.parent_id, attrs.siblings);

		await this.triggerCategoryChanged();

		return this.essenceChanged('category', [], 'sorted');
	}
}