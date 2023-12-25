pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
validator = pathAlias '@modules/validator/validator'
Q = require 'q'
wrapperRegistry = pathAlias '@wrapperRegistry'
utils = pathAlias '@utils'

class CityAddressDataProvider extends DataProvider
	constructor : (options) ->
		super

		{@person} = options
		@sphinx = wrapperRegistry.getSphinx()

	getRules: ->
		return [
			['title, noChecked', 'safe']
			['country_id', 'isNum']
			['country_id', 'required']
		].concat(super)

	createQuery: ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		if !attrs.country_id
			throw new Error "CountryId cannot be empty!"

		@findCitiesBySphinx()
		.then (idList) =>
			@buildSqlQuery idList

			deferred.resolve()
		.done()

		return deferred.promise

	buildSqlQuery : (idList) ->
		joinValues = @sphinx.generateJoinValues idList

		@q.field 'city.city_id', 'id'
		@q.field 'city_title'
		@q.field 'region_title'
		@q.field 'area_title'
		@q.field 'is_important'

		@q.from('vw_city', 'city')
		@q.join('vw_delivery_city', "d", "city.city_id = d.city_id")
		@q.join("(#{joinValues})", "x(id, ordering)", "x.id = city.city_id")
		@q.where "city.lang_id = ?", @getLang().lang_id
		@q.where "d.site_id = ?", @getSite().site_id

		@q.order('x.ordering', true)
		@q.limit 30

	prepareData : (rows) ->
		out = []

		currentCityId = null
		if @getSafeAttr('noChecked') != '1'
			currentCityId = @getCurrentCityId()

		for row in rows
			outRow =
				id : row.id
				title : row.city_title
				checked : (row.id == currentCityId)

			if !row.is_important
				if row.area_title
					outRow.title += ", #{row.area_title}"

				if row.region_title
					outRow.title += ", #{row.region_title}"

			out.push outRow

		return out

	getCurrentCityId : ->
		return if @person then @person.city_id else null

	setup : ->
		return super
		.then () =>
			if @person?
				return @person
			else
				@getModel('person').loadCustomerInfo @getUser().getId(), @getLang().lang_id
		.then (result) =>
			@person = result

	getPageSize : ->
		return false

	findCitiesBySphinx : ->
		deferred = Q.defer()

		indexSuffix = @getEditingLang().code
		indexSuffix = utils.ucfirst(indexSuffix)

		criteria = ""

		attrs = @getSafeAttrs()
		params =
			country : parseInt(attrs.country_id)

		if attrs.title && validator.trim(attrs.title).length >= 1
			criteria = "
					and match(:query)
				order by my_weight desc
				limit 50
				option field_weights=(city_title=500, region_title=1, area_title=1)
			"

			params.query = @sphinx.escapeSphinxParam("#{attrs.title}*")
		else
			criteria = "
				and is_important = 1
				order by
					city_title asc
			"

		sqlText = "
			select
				id,
				weight() + is_important*100000 as my_weight
			from
				babylonCity#{indexSuffix}
			where
				country_id = :country
				#{criteria}
		"

		@sphinx.sql sqlText, params
		.then (rows) =>
			out = []
			for row in rows
				out.push row.id

			deferred.resolve out
		.done()

		return deferred.promise

module.exports = CityAddressDataProvider
