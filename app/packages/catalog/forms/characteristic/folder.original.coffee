pathAlias = require 'path-alias'
Characteristic = pathAlias '@p-catalog/forms/characteristic/characteristic'
Q = require 'q'
_ = require 'underscore'

class Folder extends Characteristic
	getRules: ->
		return [
			['title', 'required']
		]

	loadRecord : () ->
		return @getModel('characteristic').findException {
			include: [
				{
					model: @getModel('characteristicText')
					where:
						lang_id: @getEditingLang().lang_id
				}
			]

			where:
				characteristic_id: @pk
		}

	setupAttrsByRecord: ->
		row = @record.toJSON()

		attrs = _.extend {}, _.pick(row, ['characteristic_id'])
		_.extend attrs, _.pick(row.characteristicTexts[0], [
			'title'
		])

		@setAttributes attrs

	save: () ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		row = null

		@getRecord()
		.then (record) =>
			row = if record then record else @getModel('characteristic').build()

			if row.isNewRecord
				row.group_id = @getGroupId()

			return row.save()
		.then () =>
			@setPk row.characteristic_id
			@setRecord row

			return @findTextModel 'characteristicText', {
				characteristic_id: row.characteristic_id
				lang_id: @getEditingLang().lang_id
			}
		.then (text) =>
			text.set {
				title : attrs.title
			}

			return text.save()
		.then () =>
			return row.getCharacteristicProp()
		.then (prop) ->
			prop.is_folder = true
			return prop.save()
		.then () ->
			deferred.resolve()
		.done()

		return deferred.promise

module.exports = Folder
