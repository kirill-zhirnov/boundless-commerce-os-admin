pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
contrast = require 'wcag-contrast'
validator = pathAlias '@modules/validator/validator'

class LabelDataProvider extends DataProvider
	constructor : ->
		super

		@validPageSize.push false

	getRules : ->
		return [
			['title','safe']
		].concat(super)

	createQuery: ->
		@q.from('label')
		@q.join('label_text', 'lt', 'lt.label_id = label.label_id')
		@q.where('lt.lang_id = ?', @getEditingLang().lang_id)
		@compareRmStatus 'label.deleted_at'

		attrs = @getSafeAttrs()
		@compare 'lt.title', attrs.title, true

	sortRules : ->
		return {
			default: [{label : 'asc'}]
			attrs:
				label : 'lt.title'
		}

module.exports = LabelDataProvider
