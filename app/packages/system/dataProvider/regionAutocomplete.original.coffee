pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
Q = require 'q'
wrapperRegistry = pathAlias '@wrapperRegistry'
utils = pathAlias '@utils'
validator = pathAlias '@modules/validator/validator'

class RegionAutocomplete extends DataProvider
	initialize : ->
		@sphinx = wrapperRegistry.getSphinx()

	getRules : ->
		return [
			['country', 'isNum']
			['q,country', 'required']
		].concat(super)

	createQuery: ->
		deferred = Q.defer()

		langId = @getEditingLang().lang_id

		@findRegionsBySphinx()
		.then (idList) =>
			@buildSqlQuery idList

			deferred.resolve()
		.done()

		return deferred.promise

	buildSqlQuery : (idList) ->
		joinValues = @sphinx.generateJoinValues idList

		@q.distinct()
		@q.field 'region_id'
		@q.field 'region_title'
		@q.field 'x.ordering'

		@q.from('vw_city', 'city')
		@q.join("(#{joinValues})", "x(id, ordering)", "x.id = city.region_id")
		@q.where "city.lang_id = ?", @getEditingLang().lang_id
		@q.limit '10'

		@q.order('x.ordering', true)

	getPageSize : ->
		return false

	prepareData : (rows) ->
		out = []

		for row,i in rows
			out.push {
				id : row.region_id
				label: row.region_title
			}

		return out

	findRegionsBySphinx : ->
		deferred = Q.defer()

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
				option field_weights=(region_title=1000)
			"

			params.query = @sphinx.escapeSphinxParam("#{attrs.q}*")
		else
			criteria = "
				order by region_title asc
			"

		sqlText = "
			select
				region_id,
				weight() as my_weight
			from
				babylonRegion#{indexSuffix}
			where
				country_id = :country
				and edost_region_id != 0
				#{criteria}
		"

		@sphinx.sql sqlText, params
		.then (rows) =>
			out = []
			for row in rows
				out.push row.region_id

			deferred.resolve out
		.done()

		return deferred.promise


module.exports = RegionAutocomplete
