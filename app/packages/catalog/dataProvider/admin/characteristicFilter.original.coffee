pathAlias = require 'path-alias'
CharacteristicDataProvider = pathAlias '@p-catalog/dataProvider/admin/characteristic'

class CharacteristicFilterDataProvider extends CharacteristicDataProvider
	getRules: ->
		return [
			['filterId', 'safe']
		].concat(super)

	createQuery: ->
		@createBasicQuery()

		@q.field "vw.characteristic_id"
		@q.field "vw.title"
		@q.field "vw.is_folder"
		@q.field "filter_field.field_id"

		@q.left_join "filter_field", null, "filter_field.characteristic_id = vw.characteristic_id and filter_id = #{@getDb().escape(@getSafeAttr('filterId'))}"

	prepareData : (rows) ->
		out = []
		checked = []

		parent = null
		folder = null

		for row in rows
			if row.field_id?
				checked.push row.characteristic_id

			if row.is_folder
				if folder?
					out.push folder
				else if parent?
					out.push parent

				folder =
					title : row.title
					list : []

				parent = folder.list
			else
				if !parent?
					parent = []

				parent.push [row.characteristic_id, row.title]

		if folder
			out.push folder
		else if parent
			out.push parent

		return {
			characteristics : out
			checked : checked
		}

module.exports = CharacteristicFilterDataProvider