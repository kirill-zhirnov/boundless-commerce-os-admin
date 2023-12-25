pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class CollectionDataProvider extends DataProvider
	getRules: ->
		return [
			['title, alias', 'safe']
		].concat(super)

	createQuery: ->
		@q.from('collection')
		@q.where('site_id = ?', @getEditingSite().site_id)
		@q.where('lang_id = ?', @getEditingLang().lang_id)

		@compareRmStatus 'deleted_at'
		@compare 'title', @getSafeAttr('title'), true
		@compare 'alias', @getSafeAttr('alias'), true

	sortRules: ->
		return {
			default: [{title: 'asc'}]
			attrs:
				title: 'collection.title'
		}

module.exports = CollectionDataProvider