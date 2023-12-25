const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');

/**
 * Class needs to load left menu with sub-categories and
 * detect if filter forms needed on given category.
 */
class BasicFilters extends DataProvider {
	constructor(options) {
		super(options);

		({
			filterId: this.filterId,
			category: this.category,
			hasSubCategories: this.hasSubCategories,
			subCategoriesTree: this.subCategoriesTree,
			breadCrumbs: this.breadCrumbs
		} = options);

		this.formFilters = false;
		this.categoryFilter = null;

		if (!Array.isArray(this.breadCrumbs))
			this.breadCrumbs = [];
	}

	getRules() {
		return [];
	}

	async getData() {
		let filterId;

		if (this.category.use_filter) {
			let filterTypes = await this.calcFilterTypes();
			filterId = filterTypes.filterId;

			if (filterTypes.qty.category) {
				await this.setupCategoryFilter();
			}

			Object.keys(filterTypes.qty).forEach((key) => {
				if (key != 'category')
					this.formFilters = true;
			});
		} else {
			await this.setupCategoryFilter();
		}

		return {
			formFilters: this.formFilters,
			categoryFilter: this.categoryFilter,
			hasFilters: (this.formFilters || this.categoryFilter) ? true : false,
			filterId
		};
	}

	async setupCategoryFilter() {
		let breadCrumbs = [];

		if (this.hasSubCategories) {
			this.categoryFilter = {
				categories: this.subCategoriesTree,
				category: this.category.category_id,
			};

			if (this.category.parent_id)
				breadCrumbs = this.breadCrumbs;
		} else {
			let siblings = await this.loadCategorySiblings();

			if (this.category.parent_id)
				breadCrumbs = this.breadCrumbs.filter((row) => ('url' in row));

			this.categoryFilter = {
				categories: siblings,
				category: this.category.category_id
			};
		}

		if (breadCrumbs.length)
			this.categoryFilter.breadCrumbs = breadCrumbs;
	}

	async loadCategorySiblings() {
		let select = this.getDb().squel().select()
			.field('vw_category_option.*')
			.field('category_prop.custom_link')
			.from('vw_category_option')
			.left_join('category_prop', null, 'category_prop.category_id = vw_category_option.category_id')
			.where('site_id = ?', this.getSite().site_id)
			.where('lang_id = ?', this.getLang().lang_id)
			.order('tree_sort')
		;

		if (this.category.parent_id) {
			select.where('parent_id = ?', this.category.parent_id);
		} else {
			select.where('parent_id is null');
		}

		select
			.where('status = ?', 'published')
			.where('deleted_at is null')
		;

		let rows = await this.getDb().execSquel(select),
			siblings = []
		;

		rows.forEach((row) => {
			siblings.push({
				id: row.category_id,
				title: row.title,
				url: this.getModel('category').createUrl(this.getController(), row)
			});
		});

		return siblings;
	}

//	version with outputing children of siblings:
/*	async loadCategorySiblings() {
		let select = this.getDb().squel().select()
			.from('vw_category_option')
			.where('site_id = ?', this.getSite().site_id)
			.where('lang_id = ?', this.getLang().lang_id)
			.where('status = ?', 'published')
			.where('deleted_at is null')
			.order('tree_sort')
		;


		let rows = await this.getDb().execSquel(select);

		//find current category to get parent_id and level
		let currentCategory = rows.find((row) => row.category_id == this.category.category_id);

		let prepareRow = (row) => {
			return {
				id: row.category_id,
				title: row.title,
				url: this.getModel('category').createUrl(this.getController(), row)
			}
		};

		let siblings = [];
		rows.forEach((row) => {
			if (row.parent_id == currentCategory.parent_id) {
				siblings.push(prepareRow(row));
			} else if (row.level > currentCategory.level) {
				console.log('- in next level', row);
				let parentSibling = siblings.find((siblingRow) => siblingRow.id == row.parent_id);

				if (parentSibling) {
					if (!Array.isArray(parentSibling.nodes))
						parentSibling.nodes = [];

					parentSibling.nodes.push(prepareRow(row));
				}
			}
		});

		return siblings;
	}*/

	async calcFilterTypes() {
		let select = this.getDb().squel().select()
			.field('filter_field.filter_id')
			.field('type')
			.field('count(*)', 'qty ')
			.from('filter_field')
			.group('filter_field.filter_id, type')
		;

		if (this.filterId) {
			select.where('filter_field.filter_id = ?', this.filterId);
		} else {
			select
				.join('filter', null, 'filter.filter_id = filter_field.filter_id')
				.where('filter.is_default is true')
			;
		}

		let rows = await this.getDb().execSquel(select);

		let qty = {},
			filterId = null;

		rows.forEach((row) => {
			filterId = row.filter_id;
			qty[row.type] = parseInt(row.qty);
		});

		return {qty, filterId};
	}
}

module.exports = BasicFilters;