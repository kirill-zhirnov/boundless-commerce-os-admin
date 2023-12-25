pathAlias = require 'path-alias'
ProductDataProvider = pathAlias '@p-catalog/dataProvider/product'

class ProductManufacturerDataProvider extends ProductDataProvider
	constructor : (options) ->
		super

		# @manufacturer - manufacturer ID
		{@manufacturerId} = options

		@distinctOn = "select distinct on(p.product_id, pt.title, is_available, sort_price) "

	createQuery: ->
		@createBaseQuery()

		@q.where "p.manufacturer_id = ?", @manufacturerId
		@q.where "p.status = 'published' and p.deleted_at is null"

		@applyFilters()

	applyFilters : ->
		super

		for filter in @filterFields
			switch filter.type
				when "category"
					if filter.value
						@q.join 'product_category_rel', 'rel', "
							rel.product_id = p.product_id
							and rel.category_id = #{@getDb().escape(filter.value)}
						"

	getBasicSortRules: ->
		return []

	validateCategory: ->
		return true

	prepareCategoryFilter : (filter, queryAttrs) ->
		filter.value = null
		filter.name = "category"

		if filter.name of queryAttrs
			categoryId = parseInt(queryAttrs[filter.name])

			if categoryId && categoryId > 0
				filter.value = categoryId
				@filterValues[filter.name] = categoryId

		return filter

module.exports = ProductManufacturerDataProvider