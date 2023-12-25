pathAlias = require 'path-alias'
ProductAutocompleteDataProvider = pathAlias '@p-orders/dataProvider/admin/productAutocomplete'
_ = require 'underscore'
thumbnailUrl = pathAlias '@p-cms/modules/thumbnail/url'

class ItemsMovementAutocompleteDataProvider extends ProductAutocompleteDataProvider
	getRules : ->
		return [
			['locationId', 'safe']
		].concat(super)


	buildSqlQuery: (idList) ->
		joinValues = @sphinx.generateJoinValues idList
		locationId = @getSafeAttr('locationId')

		if !locationId
			throw new Error 'You must specify warehouseId!'

		@q.distinct()
		@q.field('p.product_id')
		@q.field("
			case
				when p.type = 'product' then p.item_id
				else 0
			end
		", 'item_id')
		@q.field('p.product_sku as sku')
		@q.field('p.product_title as title')
		@q.field('stock.available_qty')
		@q.field('stock.reserved_qty')
		@q.field('p.price')
		@q.field('p.has_variants')
		@q.field('p.img_path as img_path')
		@q.field('p.img_width as img_width')
		@q.field('p.img_height as img_height')
		@q.field('x.ordering')
		@q.from('vw_inventory_item', 'p')
		@q.join("(
			SELECT
				item_id,
				sum(available_qty) as available_qty,
				sum(reserved_qty) as reserved_qty
			FROM
				inventory_stock
			WHERE
				location_id = #{@getDb().escape(locationId)}
			GROUP BY item_id
		)", 'stock', 'p.item_id = stock.item_id')
		@q.join('product', null, 'product.product_id = p.product_id')
		@q.join("(#{joinValues})", "x(id, ordering)", "x.id = p.product_id")
		@q.join('price', null, 'price.price_id = p.price_id')

		@q.where('product.deleted_at is null')
		@q.where('p.lang_id = ?', @getEditingLang().lang_id)
		@q.where("price.alias = ?", 'selling_price')
		@q.where('stock.available_qty > 0')

		@q.order('x.ordering', true)

	prepareData: (rows) ->
		locale = @getLocale()
		out = []

		for row,i in rows
			label = row.title

			if row.sku
				label += ", #{row.sku}"

			if row.trackInventory
				label += @getI18n().__(", qty: %s", [row.available_qty])

			if !_.isUndefined(row.price)
				label += ", #{row.price}"

			out.push {
				id: row.product_id
				label: label
				price: row.price
				item_id: row.item_id
				available_qty: row.available_qty
				reserved_qty: row.reserved_qty
				title: row.title
				sku: row.sku
				variants: row.has_variants
				thumb200: thumbnailUrl.getAttrs(@getInstanceRegistry(), {
					path : row.img_path
					width : row.img_width
					height : row.img_height
				}, 'scaled', 's')
			}

		return out


module.exports = ItemsMovementAutocompleteDataProvider
