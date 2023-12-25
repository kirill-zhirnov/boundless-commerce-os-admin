import BasicCategoryForm from '../../forms/category/basic';

export default class QuickEditCategory extends BasicCategoryForm {
	getRules() {
		return [
			['category_title', 'required'],
		];
	}

	async save() {
		let attrs = this.getSafeAttrs(),
			upTextAttrs = {
				//@ts-ignore
				title: attrs.category_title
			}
		;
		//@ts-ignore
		attrs.parent_id = null;

		let record = await this.getRecord();
		if (!record) {
			record = await this.saveCategoryAttrs(null, {
				parent_id: null
			});
			//@ts-ignore
			this.pk = record.category_id;

			//@ts-ignore
			upTextAttrs.url_key = await this.getModel('category').createUrlKeyByTitle(
				//@ts-ignore
				attrs.category_title,
				this.getLang().code,
				this.pk
			);
		}

		await this.getModel('categoryText').update(upTextAttrs, {
			where: {
				category_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});

		await this.getModel('categoryMenuRel').showInCategoryMenu(record.category_id, this.getEditingSite().site_id);
		this.record = record;

		await this.triggerCategoryChanged();
	}
}