pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class FilterFieldDataProvider extends DataProvider
	getRules: ->
		return [
			['filterId', 'isNum']
			['filterId', 'required']
		].concat(super)

	createQuery: ->
		escapedLangId = @getDb().escape @getEditingLang().lang_id

		@q.field('f.field_id')
		@q.field('f.type')
		@q.field('f.sort')
		@q.field('c.characteristic_id')
		@q.field('ct.title', 'characteristic_title')

		@q.from('filter_field', 'f')
		@q.left_join('characteristic', 'c', 'f.characteristic_id = c.characteristic_id')
		@q.left_join('characteristic_text', 'ct', "ct.characteristic_id = c.characteristic_id and ct.lang_id = #{escapedLangId}")

		filterId = @getSafeAttr('filterId')
		if !filterId
			throw new Error "You must specify filterId!"

		@q.where('f.filter_id = ?', filterId)
		@q.where('f.type != ?', 'category')

	prepareData : (rows) ->
		out = []
		for row in rows
			out.push {
				id : row.field_id
				title : @getTitleByRow(row)
				type : row.type
			}

		return out

	sortRules: ->
		return {
			default: [{sort: 'asc'}]
			attrs:
				sort: 'f.sort'
		}

	getTitleByRow : (row) ->
		switch row.type
			when "category"
				return @getI18n().__("Category")
			when "brand"
				return @getI18n().__("Manufacturer")
			when "price"
				return @getI18n().__("Price")
			when "availability"
				return @getI18n().__("Availability")
			when "characteristic"
				return row.characteristic_title

	getPageSize : ->
		return false

module.exports = FilterFieldDataProvider