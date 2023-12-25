import CategoryBasicForm from './basic';
import validator from '../../../../modules/validator/validator';

export default class CategoryPropsForm extends CategoryBasicForm {
	getRules() {
		return [
			['show_filters, display_in_menu, show_in_parent_page_menu', 'safe'],
			// ['sub_category_policy', 'required'],
			// ['sub_category_policy', 'inOptions', {options: 'subCategoryPolicy'}],
			['filter_id', 'inOptions', {options: 'filter'}],
			['link_from_menu', 'validateLinkFromMenu'],
			['custom_link', 'trim'],
		];
	}

	rawOptions() {
		return {
			// subCategoryPolicy: [
			// 	['default', this.__('By default (as in general settings)')],
			// 	['subGoods', this.__('Show goods from sub-categories')],
			// 	['subCategories', this.__('Show sub-categories list')],
			// 	['subCategoriesNoLeftMenu', this.__('Show sub-categories list without left menu')]
			// ],
			//@ts-ignore
			filter: this.getModel('filter').loadOptions([['', this.__('Use default filters')]])
		};
	}

	async setupAttrs() {
		//@ts-ignore
		const {categoryProp, category_id, status} = await this.getRecord();

		//@ts-ignore
		const {use_filter, filter_id, sub_category_policy, custom_link, show_in_parent_page_menu} = categoryProp;

		const attrs = {
			show_filters: use_filter ? 1 : 0,
			filter_id: filter_id || '',
			sub_category_policy: sub_category_policy || 'default',
			display_in_menu: (status === 'draft') ? 1 : 0,
			link_from_menu: custom_link ? 1 : 0,
			custom_link,
			show_in_parent_page_menu: show_in_parent_page_menu ? 1 : 0
		};

		const displayInMenuRow = await this.getDb().sqlOne(`
			select
				1 as res
			from
				category_menu_rel
				inner join menu_block using (block_id)
			where
				menu_block.key = 'category'
				and category_id = :pk
		`, {
			pk: category_id
		});

		if (displayInMenuRow)
			//@ts-ignore
			attrs.display_in_menu = 1;

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {sub_category_policy, show_filters, filter_id, link_from_menu, custom_link, show_in_parent_page_menu, display_in_menu} = this.getSafeAttrs();
		//@ts-ignore
		const	{category_id} = await this.getRecord();

		let newAttrs = {
			sub_category_policy: sub_category_policy == 'default' ? null : sub_category_policy,
			use_filter: show_filters == '1',
			filter_id: show_filters == '1' ? filter_id : null,
			custom_link: link_from_menu == '1' ? custom_link : null,
			show_in_parent_page_menu: show_in_parent_page_menu == '1'
		};

		await this.getModel('categoryProp').update(newAttrs, {
			where: {
				category_id
			}
		});

		if (display_in_menu == '1') {
			//@ts-ignore
			await this.getModel('categoryMenuRel').showInCategoryMenu(category_id, this.getEditingSite().site_id);
		} else {
			//@ts-ignore
			await this.getModel('categoryMenuRel').hideFromCategoryMenu(category_id, this.getEditingSite().site_id);
		}
	}

	validateLinkFromMenu(value) {
		//@ts-ignore
		if (value == '1' && validator.trim(this.attributes.custom_link) == '') {
			this.addError('custom_link', 'empty', this.__('Please specify link'));
			return;
		}
	}
}