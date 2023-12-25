pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'

class Option extends Form
	constructor : (options = {}) ->
		super

		@category = options.category

		if !@category
			throw new Error "You must set category!"

	getRules: ->
		return [
			['title', 'required'],
			['alias', 'isUnique', {
				field : 'alias'
				row : @record
				model : @getModel('inventoryOption')
				criteria :
					where :
						category : @category
			}],
			['sort', 'isNum']
		]

	loadRecord: () ->
		return @getModel('inventoryOption').findException {
			include: [{
				model: @getModel('inventoryOptionText')
				where:
					lang_id: @getEditingLang().lang_id
			}]
			where:
				option_id: @pk
		}

	setupAttrsByRecord: ->
		row = @record.toJSON()

		attrs = _.extend {}, _.pick(row, ['alias', 'sort'])

		_.extend attrs, _.pick(row.inventoryOptionTexts[0], [
			'title'
		])

		@setAttributes attrs

	save: () ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		row = null

		@getRecord()
		.then (record) =>
			if record
				row = record
				row.sort = attrs.sort
			else
				row = @getModel('inventoryOption').build()
				row.category = @category

			row.alias = attrs.alias

			return row.save()
		.then () =>
			@pk = row.option_id

			return @findTextModel 'inventoryOptionText', {
				option_id: row.option_id
				lang_id: @getEditingLang().lang_id
			}
		.then (text) =>
			text.set {
				title: attrs.title
			}
			return text.save()
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	getTplData : ->
		deferred = Q.defer()

		super
		.then (data) =>
			data.action = @url("inventory/admin/option/#{@category}/form")

			deferred.resolve data
		.done()

		return deferred.promise

module.exports = Option
