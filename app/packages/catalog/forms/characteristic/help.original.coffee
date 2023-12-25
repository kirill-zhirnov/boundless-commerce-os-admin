pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'

class Help extends Form
	getRules: ->
		return [
			['help', 'safe']
		]

	loadRecord: () ->
		return @getModel('characteristicText').findException {
			where:
				characteristic_id: @pk
				lang_id: @getEditingLang().lang_id
		}

	setupAttrsByRecord: ->
		row = @record.toJSON()

		attrs = _.extend {}, _.pick(row, ['help'])

		@setAttributes attrs

	save: () ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		@getRecord()
		.then (row) =>
			row.set _.pick(attrs, ['help'])

			return row.save()
		.then () ->
			deferred.resolve()
		.done()

		return deferred.promise

module.exports = Help
