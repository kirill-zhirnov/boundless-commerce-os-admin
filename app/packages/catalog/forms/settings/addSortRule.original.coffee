pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'
ruleType = require './sort/ruleType'

class addSortRule extends Form
	initialize : ->
		@rules = null
		@modalRedirect = null
		@categorySettings = null

	getRules: ->
		return [
			['new_rule_type', 'required']
			['new_rule_type', 'inOptions', {options: 'type'}]
			['new_rule_type', 'validateOnUniqueRule']
		]

	save: () ->
		return Q()
		.then () =>
			return @getRuleByType(@getSafeAttr('new_rule_type'))
		.then (rule) =>
			@rules.push rule

			@categorySettings.sort = @rules
			return @getRegistry().getSettings().set('catalog', 'category', @categorySettings)

	validateOnUniqueRule : (value, options, field) ->
		if !@hasErrors(field) && _.indexOf(['availability', 'price', 'name', 'created_at'], value) != -1
			for rule in @rules
				if rule.type == value
					@addError field, 'notUnique', @getI18n().__('Sorting rule by selected parameter already exists!')

		return true

	setup : ->
		return super
		.then () =>
			return @getRegistry().getSettings().get('catalog', 'category')
		.then (result) =>
			@categorySettings = result
			@rules = if _.isArray(result.sort) then result.sort else []

			return

	getModalRedirect : ->
		return @modalRedirect

	getRuleByType : (type) ->
		out =
			type : type
			mode : 'asc'
			props : {}

		return out

	rawOptions: ->
		return {
			type: ruleType(@getI18n())
		}

module.exports = addSortRule
