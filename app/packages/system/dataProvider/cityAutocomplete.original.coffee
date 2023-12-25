pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
Q = require 'q'
wrapperRegistry = pathAlias '@wrapperRegistry'
utils = pathAlias '@utils'
validator = pathAlias '@modules/validator/validator'

class CityAutocomplete extends DataProvider
	initialize : ->
		@sphinx = wrapperRegistry.getSphinx()

	getRules : ->
		return [
			['country', 'isNum']
			['q,country', 'required']
		].concat(super)

	createQuery: ->
		langId = @getEditingLang().lang_id

		return @findCitiesBySphinx()
		.then (idList) =>
			@buildSqlQuery idList

			return

	buildSqlQuery : (idList) ->
		joinValues = @sphinx.generateJoinValues idList

		@q.field 'city.city_id'
		@q.field 'city_title'
		@q.field 'region_id'
		@q.field 'region_title'
		@q.field 'area_title'
		@q.field 'is_important'

		@q.from('vw_city', 'city')
		@q.join("(#{joinValues})", "x(id, ordering)", "x.id = city.city_id")
		@q.where "city.lang_id = ?", @getEditingLang().lang_id

		@q.order('x.ordering', true)

	getPageSize : ->
		return false

	prepareData : (rows) ->
		out = []

		for row,i in rows
			regionLabel = []
			label = row.city_title

			if !row.is_important
				if row.area_title
					label += ", #{row.area_title}"
					regionLabel.push row.area_title

				if row.region_title
					label += ", #{row.region_title}"
					regionLabel.push row.region_title

			out.push {
				id : row.city_id
				label : label
				value : row.city_title
				city : row.city_title
				regionId: row.region_id
				region: row.region_title
				regionLabel: regionLabel.join(', ')
			}

		return out

	findCitiesBySphinx : ->
		indexSuffix = @getEditingLang().code
		indexSuffix = utils.ucfirst(indexSuffix)

		criteria = ""

		attrs = @getSafeAttrs()
		params =
			country : parseInt(attrs.country)

		if attrs.q && validator.trim(attrs.q).length >= 1
			criteria = "
					and match(:query)
				order by my_weight desc
				limit 10
				option field_weights=(city_title=500, is_important=10000, shipping_variants=1000, region_title=1, area_title=1)
			"

			params.query = @sphinx.escapeSphinxParam("#{attrs.q}*")
		else
			criteria = "
				and is_important = 1
				order by
					city_title asc
			"

		sqlText = "
			select
				id,
				weight() + is_important*100000 + shipping_variants*1000 as my_weight
			from
				babylonCity#{indexSuffix}
			where
				country_id = :country
				#{criteria}
		"

		return @sphinx.sql sqlText, params
		.then (rows) =>
			out = []
			for row in rows
				out.push row.id

			return out

module.exports = CityAutocomplete
