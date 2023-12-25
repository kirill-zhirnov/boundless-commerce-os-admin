// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');

class ProductVariantsDataProvider extends DataProvider {
	getRules() {
		return [
			['productId,warehouseId,locationId', 'safe']
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		const productId = this.getSafeAttr('productId');
		const warehouseId = this.getSafeAttr('warehouseId');
		const locationId = this.getSafeAttr('locationId');

		if (!productId) {
			throw new Error('You must specify productId!');
		} else if (!warehouseId && !locationId) {
			throw new Error('You must specify warehouseId!');
		}

		this.q.field('ii.item_id');
		this.q.field('vt.title');
		this.q.field('pt.title as product_title');
		this.q.field('v.sku');
		this.q.field('stock.available_qty');
		this.q.field('stock.reserved_qty');
		this.q.field('ip.value as price');
		this.q.from('variant', 'v');
		this.q.join('variant_text', 'vt', 'vt.variant_id = v.variant_id');
		this.q.join('product_text', 'pt', 'pt.product_id = v.product_id');
		this.q.join('inventory_item', 'ii', 'ii.variant_id = v.variant_id');
		this.q.join('inventory_stock', 'stock', 'ii.item_id = stock.item_id');
		this.q.join('inventory_location', 'il', 'il.location_id = stock.location_id');
		this.q.join('inventory_price', 'ip', 'ii.item_id = ip.item_id');
		this.q.join('price', null, 'price.price_id = ip.price_id');

		this.q.where('v.deleted_at is null');
		this.q.where('vt.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('pt.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where("price.alias = 'selling_price'");
		this.q.where('stock.available_qty > 0');

		this.compare('il.warehouse_id', warehouseId);
		this.compare('il.location_id', locationId);
		return this.compare('v.product_id', productId);
	}

	prepareData(rows) {
		return rows;
	}

	sortRules() {
		return {
			default: [{variant_id: 'asc'}],
			attrs: {
				variant_id : 'v.variant_id'
			}
		};
	}
}

module.exports = ProductVariantsDataProvider;
