pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class ServiceDataProvider extends DataProvider
	getRules: ->
		return [
			['id,title,price', 'safe']
		].concat(super)

	createQuery: ->
		@q.from('service', 's')
		@q.join('service_text', 'st', 'st.service_id = s.service_id')
		@q.where('st.lang_id = ?', @getEditingLang().lang_id)
		@q.where('s.show_in_list = true')

		@compareRmStatus 's.deleted_at'
		@compare 's.service_id', @getSafeAttr('service_id')
		@compare 'st.title', @getSafeAttr('title'), true
		@compareNumber 's.price', @getSafeAttr('price')

	sortRules: ->
		return {
			default: [{title: 'asc'}]
			attrs:
				service_id: 's.service_id'
				title: 'st.title'
		}

module.exports = ServiceDataProvider
