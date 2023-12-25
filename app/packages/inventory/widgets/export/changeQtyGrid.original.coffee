pathAlias = require 'path-alias'
ChangeQtyGrid = pathAlias '@p-inventory/widgets/changeQtyGrid.@c'

class ChangeQtyExport extends ChangeQtyGrid
	initGrid: ->
		@export = ['excel']
		@idAttribute = 'item_id'
		@columns = [
			{
				label : 'ID'
				name : 'item_id'
			},

			{
				label : @getI18n().__('Date')
				cell : 'html'
				html : (column, model) ->
					return model.get('date') + ' ' + model.get('time')
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
				name : 'title'
			},

			{
				label : @getI18n().__('Sku')
				name : 'sku'
			},

			{
				label : @getI18n().__('Reason')
				name : 'reason_title'
			},

			{
				label : @getI18n().__('User')
				name : 'person'
			},

			{
				label : @getI18n().__('Person email')
				name : 'email'
			},

			{
				label : @getI18n().__('Order')
				name : 'order_id'
			},

			{
				label : @getI18n().__('From warehouse')
				name : 'from_warehouse_title'
			},

			{
				label : @getI18n().__('To warehouse')
				name : 'to_warehouse_title'
			},

			{
				label : @getI18n().__('Available qty change')
				name : 'available_qty_diff'
			},

			{
				label : @getI18n().__('Reserved qty change')
				name : 'reserved_qty_diff'
			}
		]

module.exports = ChangeQtyExport
