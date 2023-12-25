pathAlias = require 'path-alias'
StockPerWarehouseGrid = pathAlias '@p-inventory/widgets/stockPerWarehouseGrid.@c'

class StockPerWarehouseExport extends StockPerWarehouseGrid
	initGrid: ->
		@export = ['excel']
		@idAttribute = 'item_id'
		@columns = [
			{
				label : 'ID'
				name : 'item_id'
			},

			{
				label : @getI18n().__('Type')
				name : 'type'
			},

			{
				label : @getI18n().__('Product ID')
				name : 'product_id'
			},

			{
				label : @getI18n().__('Variant ID')
				name : 'variant_id'
			},

			{
				label : @getI18n().__('Title')
				cell : 'html'
				html : (column, model) ->
					title = model.get('product_title')

					if model.get('variant_title')?
						title = "#{title}, #{model.get('variant_title')}"

					return title
			},

			{
				label : @getI18n().__('Sku')
				cell : 'html'
				html : (column, model) ->
					return if model.get('variant_sku') then model.get('variant_sku') else model.get('product_sku')
			},

			{
				label : @getI18n().__('Commodity group')
				name : 'commodity_group_title'
			},

#			{
#				label : @getI18n().__('Track inventory')
#				cell : 'html'
#				html : (column, model) ->
#					return !model.get('not_track_inventory')
#			},

			{
				label : @getI18n().__('Price')
				name : 'price'
			},

			{
				label : @getI18n().__('Available qty')
				name : 'available_qty'
			},

			{
				label : @getI18n().__('Reserved qty')
				name : 'reserved_qty'
			},

#			{
#				label : @getI18n().__('YML export')
#				cell : 'html'
#				html : (column, model) ->
#					return model.get('yml_export')
#			},
		]

module.exports = StockPerWarehouseExport
