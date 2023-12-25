pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'
ruleType = require './sort/ruleType'
utils = pathAlias '@utils'

class Sort extends Form
	initialize : ->
		super

		@sortRules = []
		@categorySettings = null

	getRules: ->
		return [
			['limit, sub_category_policy', 'required'],
			['limit', 'isNum', {min: 1, max: 40}],
			['mode', 'safe'],
			['sub_category_policy', 'inOptions', {'options': 'subCategoryPolicy'}],
			['products_aos', 'inOptions', {options: 'aos'}]
		]

	setup : ->
		return super
		.then () =>
			return @getInstanceRegistry().getSettings().get('catalog', 'category')
		.then (value) =>
			@categorySettings = value
			@sortRules = if _.isArray(value.sort) then value.sort else []

			@attributes.limit = value.limit
			@attributes.sub_category_policy = value.sub_category_policy
			@attributes.products_aos = value.productsAos

			return

	getTplData : ->
		return super
		.then (data) =>
			data.sortRules = @sortRules

			return data

	save: () ->
		attrs = @getSafeAttrs()

		for rule, i in @sortRules
			if attrs.mode[rule.type] && _.indexOf(['asc', 'desc'], attrs.mode[rule.type]) != -1
				@sortRules[i].mode = attrs.mode[rule.type]

		return @getInstanceRegistry().getSettings().set('catalog', 'category', {
			sort: @sortRules,
			limit: parseInt(attrs.limit),
			sub_category_policy: attrs.sub_category_policy,
			productsAos: if attrs.products_aos then attrs.products_aos else null
		})

	rawOptions: ->
		ruleTypeOptions = ruleType(@getI18n())

		aos = @getAosOptions()
		aos.unshift(['', @__('Without animation')])

		out = {
			type: ruleTypeOptions,
			subCategoryPolicy: [
				['subGoods', @__('Show goods from sub-categories')],
				['subCategories', @__('Show sub-categories list')],
				['subCategoriesNoLeftMenu', @__('Show sub-categories list without left menu')],
			],
			aos: aos
		}

		for row in ruleTypeOptions
			out["mode_#{row[0]}"] = @getModeOptionsByType(row[0])

		return out

	getModeOptionsByType : (type) ->
		switch type
			when "availability"
				return [
					["asc", @getI18n().__("First in-stock")],
					["desc", @getI18n().__("First out-of-stock")]
				]

			when "price"
				return [
					["asc", @getI18n().__("Cheap first")],
					["desc", @getI18n().__("Expensive first")]
				]

			when "name"
				return [
					["asc", @getI18n().__("A -> Z")],
					["desc", @getI18n().__("Z -> A")]
				]

			when "created_at"
				return [
					["asc", @__("Newest last")],
					["desc", @__("Newest first")]
				]

			else
				throw new Error "Mode options for type '#{type}' not defined!"

	removeRule : (type) ->
		[i, rule] = @getRuleByType(type)
		if !_.isUndefined(i)
			@sortRules.splice i, 1

		return @saveSortRules()

	saveSort : (sort) ->
		newOrder = []
		for type in sort
			[i, rule] = @getRuleByType(type)

			if !_.isUndefined(i)
				newOrder.push rule

		@sortRules = newOrder

		return @saveSortRules()

	getRuleByType : (type) ->
		for rule, i in @sortRules
			if rule.type == type
				return [i, rule]

	saveSortRules : ->
		@categorySettings.sort = @sortRules

		return @getRegistry().getSettings().set('catalog', 'category', @categorySettings)

module.exports = Sort