pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'

class Props extends Form
	getRules: ->
		return [
			['layout', 'inOptions', {options: 'layout'}],
		]

	loadRecord: () ->
		return @getModel('manufacturer').findException {
			where:
				manufacturer_id: @pk
		}

	setupAttrsByRecord: ->
		row = @record.toJSON()

		attrs = _.extend {}, _.pick(row, ['layout'])

		@setAttributes attrs

	save: () ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		@getRecord()
		.then (record) =>
			return record.set(_.pick(attrs, ['layout'])).save()
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	rawOptions : ->
		return {
			layout : @getView().getPublicLayoutsOptions()
		}

module.exports = Props
