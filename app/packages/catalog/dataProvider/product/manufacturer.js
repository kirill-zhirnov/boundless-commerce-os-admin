// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const ProductDataProvider = pathAlias('@p-catalog/dataProvider/product');

class ProductManufacturerDataProvider extends ProductDataProvider {
	constructor(options) {
		super(...arguments);

		// @manufacturer - manufacturer ID
		({manufacturerId: this.manufacturerId} = options);

		this.distinctOn = "select distinct on(p.product_id, pt.title, is_available, sort_price) ";
	}

	createQuery() {
		this.createBaseQuery();

		this.q.where("p.manufacturer_id = ?", this.manufacturerId);
		this.q.where("p.status = 'published' and p.deleted_at is null");

		return this.applyFilters();
	}

	applyFilters() {
		super.applyFilters(...arguments);

		return (() => {
			const result = [];
			for (let filter of Array.from(this.filterFields)) {
				switch (filter.type) {
					case "category":
						if (filter.value) {
							result.push(this.q.join('product_category_rel', 'rel', `\
rel.product_id = p.product_id \
and rel.category_id = ${this.getDb().escape(filter.value)}\
`
							));
						} else {
							result.push(undefined);
						}
						break;
					default:
						result.push(undefined);
				}
			}
			return result;
		})();
	}

	getBasicSortRules() {
		return [];
	}

	validateCategory() {
		return true;
	}

	prepareCategoryFilter(filter, queryAttrs) {
		filter.value = null;
		filter.name = "category";

		if (filter.name in queryAttrs) {
			const categoryId = parseInt(queryAttrs[filter.name]);

			if (categoryId && (categoryId > 0)) {
				filter.value = categoryId;
				this.filterValues[filter.name] = categoryId;
			}
		}

		return filter;
	}
}

module.exports = ProductManufacturerDataProvider;