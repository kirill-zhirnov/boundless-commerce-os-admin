pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class OptionDataProvider extends DataProvider
	constructor : (options = {}) ->
		super

		@category = options.category

		if !@category
			throw new Error "You must set category!"

	getRules: ->
		return [
			[
				'option_id,alias,title,sort',
				'safe'
			]
		].concat(super)

	createQuery: ->
		@q.from('inventory_option', 'o')
		@q.join('inventory_option_text', 'ot', 'ot.option_id = o.option_id')
		@q.where('ot.lang_id = ?', @getEditingLang().lang_id)
		@q.where('o.category = ?', @category)

		@compareRmStatus 'o.deleted_at'

		@compare 'o.option_id', @getSafeAttr('option_id')
		@compare 'o.alias', @getSafeAttr('alias'), true
		@compare 'ot.title', @getSafeAttr('title'), true
		@compareNumber 'o.sort', @getSafeAttr('sort')

	sortRules: ->
		return {
			default: [{sort : 'asc'}]
			attrs:
				option_id: 'o.option_id'
				title: 'ot.title'
				sort: 'o.sort'
		}

module.exports = OptionDataProvider
