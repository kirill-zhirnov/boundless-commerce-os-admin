pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
Backbone = pathAlias '@bb'
Q = require 'q'
_ = require 'underscore'

class CategoryDataProvider extends DataProvider
	getRules: ->
		return [
			['title, inMenu, opened', 'safe']
		].concat(super)

	getTreeCollection : ->
#		don't care about the result. Promise can be resolved or rejected - don't care.
		return Q.allSettled([@validate()])
		.then () =>
			return @createSql()
		.then (sql) =>
			if !_.isObject(sql) || !sql.text || !sql.values
				throw new Error "createSql should return/resolve with object with: 'text' and 'values' props."

			return @getDb().sql(sql.text, sql.values)
		.then (rows) =>
			collection = new Backbone.TreeCollection()

			for row, i in rows
				parent = @chooseParent collection, row, i

				if parent is false
					continue

				parent.add @prepareTreeItem(row)

			return collection

	prepareTreeItem: (row) ->
		return {
			id: row.category_id,
			title: row.title,
			url: @createUrl(row),
			in_menu: if row.block_id then true else false,
			custom_link: row.custom_link,
			icon: row.icon,
			status: row.status,
			deleted_at: row.deleted_at
		}

	chooseParent : (collection, row, i) ->
		if row.parent_id? && !@isFilterActive()
			result = collection.where({id:row.parent_id}, {deep:true})

			if result.length == 0
				return false

			parent = result[0]
		else
			parent = collection

		return parent

	createQuery: ->
		@q.distinct()
		@q.from('vw_category_option', 'vw')
		@q.left_join('category_menu_rel', null, 'vw.category_id = category_menu_rel.category_id')
		@q.left_join('menu_block', null, "category_menu_rel.block_id = menu_block.block_id and menu_block.key = 'category'")
		@q.left_join("category_prop", null, 'category_prop.category_id = vw.category_id')

		@q.where('vw.site_id = ?', @getEditingSite().site_id)
		@q.where('vw.lang_id = ?', @getEditingLang().lang_id)

		@compareRmStatus 'vw.deleted_at'

		@compare 'vw.title', @getSafeAttr('title'), true

		attrs = @getSafeAttrs()
		if attrs.inMenu && attrs.inMenu != ''
			@q.where "menu_block.block_id is not null"
			@q.where "vw.status = 'published'"

	sortRules: ->
		return {
			default: [{tree_sort: 'asc'}]
			attrs : {
				tree_sort : 'tree_sort'
			}
		}

	createSql : ->
		@q = @squelSelect()

		return Q()
		.then () =>
			return @createQuery()
		.then () =>
			sql = @getSortSql()

			if !@isFilterActive() && sql
				@q.order sql, null

			return
		.then () =>
			return @q.toParam()

	shallSort : ->
		return true

	isFilterActive : ->
		attrs = _.pick @getSafeAttrs(), ['title', 'rmStatus']

		for attr, val of attrs
			if val && val != '0'
				return true

		return false

	rawOptions : ->
		return {
			menu : @getCategoryMenuOptions()
		}

	getCategoryMenuOptions : ->
		out = [['', @getI18n().__('Display in menu')]]

		for key, props of @getView().getMenu()
			if props.type == "category"
				out.push [key, props.title]

		return out

	createUrl: (row) ->
		return @getModel('category').createUrl @getController(), row

module.exports = CategoryDataProvider