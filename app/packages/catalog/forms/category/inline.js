import BasicCategoryForm from '../../forms/category/basic';

export default class CategoryInline extends BasicCategoryForm {
	getRules() {
		return [
			['category_title', 'required'],
			['category_parent', 'inOptions', {options: 'parent'}],
			['custom_link', 'safe'],
			[
				'category_parent',
				'tree',
				{
					pk: 'category_id',
					row: this.record
				}
			],
		];
	}

	async setupAttrsByRecord() {
		//@ts-ignore
		const {categoryTexts, parent_id, categoryProp} = this.record;

		await this.setAttributes({
			category_title: categoryTexts[0].title,
			category_parent: parent_id,
			custom_link: categoryProp.custom_link
		});
	}

	async save() {
		let isNewRecord = false;
		//@ts-ignore
		const {category_parent, category_title, custom_link} = this.getSafeAttrs();

		const record = await this.getRecord();

		if (!record) {
			isNewRecord = true;
		}

		const row = await this.saveCategoryAttrs(record, {
			parent_id: category_parent
		});

		this.pk = row.category_id;

		let urlKey;
		if (isNewRecord) {
			//@ts-ignore
			urlKey = await this.getModel('category').createUrlKeyByTitle(
				category_title,
				this.getEditingLang().code,
				this.pk
			);
		}

		const upAttrs = {
			title: category_title,
		};

		if (isNewRecord) {
			upAttrs.url_key = urlKey;
		}

		await this.getModel('categoryText').update(upAttrs, {
			where: {
				category_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});

		await this.getModel('categoryProp').update({
			custom_link: custom_link
		}, {
			where: {
				category_id: this.pk
			}
		});

		await this.saveInMenu();

		await this.triggerCategoryChanged();
	}

	async saveInMenu() {
		//@ts-ignore
		const {block_id} = await this.getModel('menuBlock').findOrCreate({
			where: {
				site_id: this.getEditingSite().site_id,
				key: 'category'
			},
			defaults: {
				site_id: this.getEditingSite().site_id,
				key: 'category'
			}
		});

		await this.getModel('categoryMenuRel').findOrCreate({
			where: {
				category_id: this.pk,
				block_id
			},
			defaults: {
				category_id: this.pk,
				block_id
			}
		});
	}

	rawOptions() {
		return {
			parent: this.getParentOptions(false)
		};
	}
}