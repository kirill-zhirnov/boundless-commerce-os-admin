pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class ProductVariantsDataProvider extends DataProvider
	getRules: ->
		return [
			['productId,warehouseId,locationId', 'safe']
		].concat(super)

	createQuery: ->
		productId = @getSafeAttr('productId')
		warehouseId = @getSafeAttr('warehouseId')
		locationId = @getSafeAttr('locationId')

		if !productId
			throw new Error 'You must specify productId!'
		else if !warehouseId && !locationId
			throw new Error 'You must specify warehouseId!'

		@q.field('ii.item_id')
		@q.field('vt.title')
		@q.field('pt.title as product_title')
		@q.field('v.sku')
		@q.field('stock.available_qty')
		@q.field('stock.reserved_qty')
		@q.field('ip.value as price')
		@q.from('variant', 'v')
		@q.join('variant_text', 'vt', 'vt.variant_id = v.variant_id')
		@q.join('product_text', 'pt', 'pt.product_id = v.product_id')
		@q.join('inventory_item', 'ii', 'ii.variant_id = v.variant_id')
		@q.join('inventory_stock', 'stock', 'ii.item_id = stock.item_id')
		@q.join('inventory_location', 'il', 'il.location_id = stock.location_id')
		@q.join('inventory_price', 'ip', 'ii.item_id = ip.item_id')
		@q.join('price', null, 'price.price_id = ip.price_id')

		@q.where('v.deleted_at is null')
		@q.where('vt.lang_id = ?', @getEditingLang().lang_id)
		@q.where('pt.lang_id = ?', @getEditingLang().lang_id)
		@q.where("price.alias = 'selling_price'")
		@q.where('stock.available_qty > 0')

		@compare 'il.warehouse_id', warehouseId
		@compare 'il.location_id', locationId
		@compare 'v.product_id', productId

	prepareData: (rows) ->
		return rows

	sortRules: ->
		return {
			default: [{variant_id: 'asc'}]
			attrs:
				variant_id : 'v.variant_id'
		}

module.exports = ProductVariantsDataProvider
