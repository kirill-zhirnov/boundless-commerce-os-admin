// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const ProductAutocompleteDataProvider = pathAlias('@p-orders/dataProvider/admin/productAutocomplete');
const _ = require('underscore');
const thumbnailUrl = pathAlias('@p-cms/modules/thumbnail/url');

class ItemsMovementAutocompleteDataProvider extends ProductAutocompleteDataProvider {
	getRules() {
		return [
			['locationId', 'safe']
		].concat(super.getRules(...arguments));
	}


	buildSqlQuery(idList) {
		const joinValues = this.sphinx.generateJoinValues(idList);
		const locationId = this.getSafeAttr('locationId');

		if (!locationId) {
			throw new Error('You must specify warehouseId!');
		}

		this.q.distinct();
		this.q.field('p.product_id');
		this.q.field(`\
case \
when p.type = 'product' then p.item_id \
else 0 \
end\
`, 'item_id');
		this.q.field('p.product_sku as sku');
		this.q.field('p.product_title as title');
		this.q.field('stock.available_qty');
		this.q.field('stock.reserved_qty');
		this.q.field('p.price');
		this.q.field('p.has_variants');
		this.q.field('p.img_path as img_path');
		this.q.field('p.img_width as img_width');
		this.q.field('p.img_height as img_height');
		this.q.field('x.ordering');
		this.q.from('vw_inventory_item', 'p');
		this.q.join(`( \
SELECT \
item_id, \
sum(available_qty) as available_qty, \
sum(reserved_qty) as reserved_qty \
FROM \
inventory_stock \
WHERE \
location_id = ${this.getDb().escape(locationId)} \
GROUP BY item_id \
)`, 'stock', 'p.item_id = stock.item_id');
		this.q.join('product', null, 'product.product_id = p.product_id');
		this.q.join(`(${joinValues})`, "x(id, ordering)", "x.id = p.product_id");
		this.q.join('price', null, 'price.price_id = p.price_id');

		this.q.where('product.deleted_at is null');
		this.q.where('p.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where("price.alias = ?", 'selling_price');
		this.q.where('stock.available_qty > 0');

		return this.q.order('x.ordering', true);
	}

	prepareData(rows) {
		const locale = this.getLocale();
		const out = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			let label = row.title;

			if (row.sku) {
				label += `, ${row.sku}`;
			}

			if (row.trackInventory) {
				label += this.getI18n().__(", qty: %s", [row.available_qty]);
			}

			if (!_.isUndefined(row.price)) {
				label += `, ${row.price}`;
			}

			out.push({
				id: row.product_id,
				label,
				price: row.price,
				item_id: row.item_id,
				available_qty: row.available_qty,
				reserved_qty: row.reserved_qty,
				title: row.title,
				sku: row.sku,
				variants: row.has_variants,
				thumb200: thumbnailUrl.getAttrs(this.getInstanceRegistry(), {
					path : row.img_path,
					width : row.img_width,
					height : row.img_height
				}, 'scaled', 's')
			});
		}

		return out;
	}
}


module.exports = ItemsMovementAutocompleteDataProvider;
