pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
Q = require 'q'
_ = require 'underscore'

class ProductCharacteristicDataProvider extends DataProvider
	initialize : (options) ->
		@redefineSettings = false
		@redefineCharacteristics = false
		@splitSize = true

		_.extend @, _.pick(options, [
			'redefineSettings',
			'redefineCharacteristics',
			'splitSize'
		])

	getRules: ->
		return [
			['productId, groupId', 'required'],
			['productId, groupId', 'isNumeric'],
		]

	createQuery: ->
		groupId = @getSafeAttr('groupId')
		productId = @getSafeAttr('productId')

		@q.field('vw.characteristic_id')
		@q.field('vw.parent_id')
		@q.field('vw.title')
		@q.field('vw.help')
		@q.field('vw.alias')
		@q.field('vw.type')
		@q.field('vw.system_type')
		@q.field('vw.is_folder')
		@q.field('vw.is_hidden')
		@q.field('vw.default_value')
		@q.field('pVal.case_id', 'value_case')
		@q.field('pValText.value', 'value_text')
		@q.field('cCase.case_id')
		@q.field('caseText.title', 'case_title')

		@q.from('vw_characteristic_grid', 'vw')
		@q.left_join(
			'characteristic_type_case',
			'cCase',
			'cCase.characteristic_id = vw.characteristic_id'
		)
		@q.left_join(
			'characteristic_type_case_text',
			'caseText',
			"cCase.case_id = caseText.case_id and caseText.lang_id = #{@getDb().escape(@getEditingLang().lang_id)}"
		)
		@q.left_join(
			'characteristic_product_val',
			'pVal',
			"
				vw.characteristic_id = pVal.characteristic_id
				and pVal.product_id = #{@getDb().escape(productId)}
				and (pVal.case_id = cCase.case_id or pVal.case_id is null)
			"
		)
		@q.left_join(
			'characteristic_product_val_text',
			'pValText',
			"pVal.value_id = pValText.value_id and pValText.lang_id = #{@getDb().escape(@getEditingLang().lang_id)}"
		)

		@q.where('vw.lang_id = ?', @getEditingLang().lang_id)
		@q.where('vw.group_id = ?', groupId)

		if @redefineSettings
			@q.where "vw.characteristic_id not in (
				select
					characteristic_id
				from
					product_variant_characteristic
				where
					product_id = ?
					and rel_type = 'variant'
			)", productId

		if @redefineCharacteristics
			@q.where "vw.characteristic_id in (
				select
					characteristic_id
				from
					product_variant_characteristic
				where
					product_id = ?
					and rel_type = 'redefine'
			)", productId

		@q.order 'vw.tree_sort'
		@q.order 'cCase.sort'

	prepareData: (rows) ->
		res = @prepareCharacteristics(rows)

		out =
			productId: @getSafeAttr('productId')
			size: res.size
			tree: res.tree

		return @loadCommodityGroup()
		.then (group) ->
			out.group = group.toJSON()

			return out

	prepareCharacteristics: (rows) ->
		tree = @makeCharacteristicsTree rows

		out =
			size: @splitSizeCharacteristics tree
			tree: @groupCharacteristics tree

		return out

	groupCharacteristics: (tree) ->
		out = []
		group =
			children: []

		tree.forEach (row) =>
			if row.is_folder
				if group.children.length > 0
					out.push group
					group = {
						children: []
					}
				out.push row
			else
				group.children.push row

		if group.children.length > 0
			out.push group

		return out

	splitSizeCharacteristics: (tree) ->
		sizeIndex = tree.findIndex (row) ->
			return row.system_type == 'size'

		if sizeIndex == -1
			return null

		size = tree[sizeIndex]
		tree.splice sizeIndex, 1

		children = {}
		if Array.isArray(size.children)
			size.children.forEach (row) ->
				children[row.system_type] = row

		size.children = children

		return size

	makeCharacteristicsTree: (rows) ->
		out = []
		key2Id = {}

		for row, i in rows
			if row.characteristic_id of key2Id
				if row.parent_id
					parent = out[key2Id[row.parent_id]]

					if !parent
						throw new Error "Parent not found: #{row.parent_id}"

					outRow = parent.children[key2Id[row.characteristic_id]]
				else
					outRow = out[key2Id[row.characteristic_id]]
			else
				outRow = _.omit row, [
					'case_id', 'case_title', 'value_case', 'value_text'
				]

				outRow.cases = []
				outRow.value = if row.type == 'checkbox' then [] else null

#				switch row.system_type
#					when 'length', 'width', 'height'
#						outRow.title += " " + @getI18n().__('(cm.)')
#
#					when 'weight'
#						outRow.title += " " + @getI18n().__('(kg.)')

				if row.is_folder
					outRow.children = []

				if row.parent_id
					parent = out[key2Id[row.parent_id]]

					if !parent
						throw new Error "Parent not found: #{row.parent_id}"

					addTo = parent.children
				else
					addTo = out

				addTo.push outRow
				key2Id[row.characteristic_id] = addTo.length - 1

			if row.case_id
				outRow.cases.push [row.case_id, row.case_title]

			if row.value_case
				if _.isArray(outRow.value)
					outRow.value.push row.value_case
				else
					outRow.value = row.value_case
			else if row.value_text
				outRow.value = row.value_text

		out = @checkValues out

		return out

#	if no value - set default.
#	need to call it after main loop - to be able to set case_id by values (because in
#	row.default_value - text representaion of value)
	checkValues : (rows) ->
		for row, i in rows
			if row.value is null || (_.isArray(row.value) && row.value.length == 0)
				rows[i].value = @prepareDefaultValue row

			if row.children
				row.children = @checkValues row.children

		return rows

	loadCommodityGroup : ->
		return @getModel('commodityGroup').findException {
			include: [{
				model : @getModel('commodityGroupText')
				where :
					lang_id : @getEditingLang().lang_id
			}]
			where:
				group_id: @getSafeAttr('groupId')
		}

	getPageSize : ->
		return false

	prepareDefaultValue : (row) ->
		return row.value

#		Do not set default value since it is confusing!

#		if row.type == 'checkbox'
#			value = []
#
#			if row.default_value
#				for textVal in row.default_value.split ','
#					if caseId = @findCaseIdByText(row.cases, validator.trim(textVal))
#						value.push caseId
#		else if ['radio', 'select'].indexOf(row.type) != -1
#			value = @findCaseIdByText row.cases, validator.trim(row.default_value)
#		else
#			value = row.default_value
#
#		return value

	findCaseIdByText : (cases, text) ->
		for row in cases
			if row[1] == text
				return row[0]

		return null

module.exports = ProductCharacteristicDataProvider
