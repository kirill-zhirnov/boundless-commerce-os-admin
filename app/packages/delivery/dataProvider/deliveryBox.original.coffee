pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
Q = require 'q'

class BoxDataProvider extends DataProvider
	getRules : ->
		return [
			['title','safe']
		].concat(super)

	createQuery: ->
		escapedLangId = @getDb().escape @getEditingLang().lang_id

		@q.from('box')
		@q.join('box_text', null, "box.box_id = box_text.box_id and box_text.lang_id = #{escapedLangId}")
		@compareRmStatus 'box.deleted_at'

		attrs = @getSafeAttrs()
		@compare 'box_text.title', attrs.title, true

	sortRules : ->
		return {
			default: [{box : 'asc'}]
			attrs:
				box : 'box_text.title'
		}

module.exports = BoxDataProvider
