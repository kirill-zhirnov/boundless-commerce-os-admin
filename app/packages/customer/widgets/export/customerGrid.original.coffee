pathAlias = require 'path-alias'
CustomerGrid = pathAlias '@p-customer/widgets/customerGrid.@c'
moment = require 'moment'

class CustomerExport extends CustomerGrid
	initGrid: ->
		@idAttribute = 'person_id'
		@columns = [
			{
				label : 'ID'
				name : 'person_id'
			},

			{
				label: @getI18n().__('First name')
				name: 'first_name'
			},
			
			{
				label: @getI18n().__('Last name')
				name: 'last_name'
			},
			
			{
				label : @getI18n().__('Email')
				name : 'email'
			},
			
			{
				label : @getI18n().__('Phone')
				name : 'phone'
			},
			
			{
				label: @getI18n().__('Post code')
				name: 'postcode'
			},
			
			{
				label: @getI18n().__('Country')
				name: 'country_title'
			},
			
			{
				label: @getI18n().__('Region')
				name: 'region_title'
			},
			
			{
				label: @getI18n().__('City')
				name: 'city_title'
			},
			
			{
				label: @getI18n().__('Address')
				name: 'address'
			},

			{
				label: @getI18n().p__('user', 'Orders sum')
				name: 'total_orders_sum'
			},

			{
				label: @getI18n().__('Total orders')
				name: 'total_orders_qty'
			},

			{
				label: @getI18n().__('Registered')
				cell : 'html'
				html : (column, model) =>
					if model.get('registered_at')
						return moment(model.get('registered_at')).format('DD.MM.YYYY HH:mm')

					return ""
			}
		]
		
module.exports = CustomerExport