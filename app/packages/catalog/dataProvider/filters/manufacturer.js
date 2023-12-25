const BasicFilters = require('./basic');

class ManufacturerFilters extends BasicFilters {
	constructor(options) {
		super(options);

		({
			manufacturer: this.manufacturer,
		} = options);

		if (!this.manufacturer)
			throw new Error('You must specify manufacturer');
	}

	async getData() {
		let filterTypes = await this.calcFilterTypes();
		let filterId = filterTypes.filterId;

		if (filterTypes.qty.category) {
			await this.setupCategoryFilter();
		}

		Object.keys(filterTypes.qty).forEach((key) => {
			if (key != 'category')
				this.formFilters = true;
		});

		return {
			formFilters: this.formFilters,
			categoryFilter: this.categoryFilter,
			hasFilters: (this.formFilters || this.categoryFilter) ? true : false,
			filterId
		};
	}

	async setupCategoryFilter() {
		let currentCategoryId = null;
		if ('category' in this.attributes) {
			currentCategoryId = parseInt(this.attributes.category);
			if (!currentCategoryId || currentCategoryId < 0)
				currentCategoryId = null;
		}

		this.categoryFilter = {
			categories: await this.loadManufacturerCategories(),
			category: currentCategoryId
		};
	}

	async loadManufacturerCategories() {
		let rows = await this.getDb().sql(`
			select
				distinct on (category.category_id, category.sort)
				category.category_id,
				ct.title,
				ct.url_key
			from
				category
				inner join category_text ct on category.category_id = ct.category_id and ct.lang_id = :lang
				inner join product_category_rel on
					category.category_id = product_category_rel.category_id
					and product_category_rel.is_default is true
				inner join product using(product_id)
			where
				category.site_id = :site
				and product.manufacturer_id = :manufacturer
				and category.deleted_at is null
				and product.deleted_at is null
			order by
				category.sort asc
		`, {
			lang: this.getLang().lang_id,
			manufacturer: this.manufacturer.manufacturer_id,
			site: this.getSite().site_id
		});

		let out = [];
		for (const row of rows) {
			out.push({
				id: row.category_id,
				title: row.title,
				url: this.url('@brand', {
					id: (this.manufacturer.url_key) ? this.manufacturer.url_key : this.manufacturer.manufacturer_id,
					category: row.category_id
				})
			});
		}

		return out;
	}
}

module.exports = ManufacturerFilters;