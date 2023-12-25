pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
thumbnailUrl = pathAlias '@p-cms/modules/thumbnail/url'

class AdminManufacturerDataProvider extends DataProvider
	getRules: ->
		return [
			['title', 'safe'] # list of attrs, which will be used in filter
		].concat(super)

	createQuery: ->
		@q.field 'm.*'
		@q.field 'mt.*'

		@q.field 'i.width'
		@q.field 'i.height'
		@q.field 'i.path'
		@q.field 'i.mime_type'

		@q.from('manufacturer', 'm')
		@q.join('manufacturer_text', 'mt', 'mt.manufacturer_id = m.manufacturer_id')
		@q.left_join('image', 'i', 'm.image_id = i.image_id')
		@q.where('mt.lang_id = ?', @getEditingLang().lang_id)

		@compareRmStatus 'm.deleted_at'
		@compare 'mt.title', @getSafeAttr('title'), true

	sortRules: ->
		return {
			default: [{title: 'asc'}]
			attrs:
				title: 'mt.title'
		}

	prepareData : (rows) ->
		for row,i in rows
			row.url = @url '@brand', {
				id : if row.url_key then row.url_key else row.manufacturer_id
			}

			if row['image_id']?
				row.smallThumb = thumbnailUrl.getAttrs @getInstanceRegistry(), row, 'scaled', 'xs'

			rows[i] = row

		return [@getMetaResult(), rows]

module.exports = AdminManufacturerDataProvider
