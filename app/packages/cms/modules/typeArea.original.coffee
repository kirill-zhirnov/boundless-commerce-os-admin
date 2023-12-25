Q = require 'q'
pathAlias = require 'path-alias'
registry = pathAlias '@registry'

class TypeArea

#	essence - used to mark uploaded images as "used_in". If image was uploaded for essence "page",
#	it will be marked as used_in : ['page'].

	constructor : (options) ->
		{@typeAreaId, @prefix, @form, @trx, @essence} = options

		if !@prefix
			@prefix = ''

		if @form
			@i18n = @form.controller.getI18n()

		@blocks = null
		@typeArea = null
		@notRemoveBlockId = []

		@db = registry.getDb()

	getTplData : ->
		deferred = Q.defer()

		Q.all([@getBlocks()])
		.then (result) =>
			[blocks] = result

			deferred.resolve {
				blocks : blocks
				types : @getTypes()
				prefix : @prefix
				essence : @essence
			}
		.done()

		return deferred.promise

	validate : ->
		@validateRequiredFields()

		return true

	save : ->
		deferred = Q.defer()

		@createTypeArea()
		.then () =>
			return @saveBlocks()
		.then () =>
			deferred.resolve @typeArea
		.done()

		return deferred.promise

	saveBlocks : ->
		deferred = Q.defer()

		@notRemoveBlockId = []

		TypeareaBlock = @db.model('typeareaBlock')

		funcs = []
		for key, block of @getValues()
			f = ((key, block) =>
				return =>
					deferredItem = Q.defer()

					Q()
					.then () =>
						if !@isNewKey(key)
							return TypeareaBlock.find {
								where :
									block_id : key
									typearea_id : @typeArea.typearea_id
								transaction : @trx
							}
					.then (row) =>
						if !row
							row = TypeareaBlock.build().set({
								typearea_id : @typeArea.typearea_id
								type : block.type
							})

						sort = block.position * 10

						return row.set({
							noindex : if block.noindex == '1' then true else false
							sort : if isNaN(sort) then null else sort
						})
						.save({transaction : @trx})
					.then (row) =>
						@notRemoveBlockId.push row.block_id

						return @saveBlockByType row, block
					.then () =>
						deferredItem.resolve()
					.done()

					return deferredItem.promise
			)(key, block)

			funcs.push f

		result = Q()
		funcs.forEach (f) ->
			result = result.then f

		result
		.then () =>
			where =
				typearea_id : @typeArea.typearea_id

			if @notRemoveBlockId.length > 0
				where.block_id =
					$notIn : @notRemoveBlockId

			return TypeareaBlock.update {
				deleted_at : @db.fn('now')
			}, {
				where : where
			}
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	saveBlockByType : (row, block) ->
		deferred = Q.defer()

		Q()
		.then () =>
			switch row.type
				when "text"
					return @db.model('typeareaBlockText').update {
						value : block.value
					}, {
						where :
							block_id : row.block_id
						transaction : @trx
					}
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	createTypeArea : ->
		deferred = Q.defer()

		Typearea = @db.model('typearea')

		Q()
		.then () =>
			if @typeAreaId?
				return Typearea.find {
					where :
						typearea_id : @typeAreaId
					transaction : @trx
				}
			else
				return Typearea.build().save({transaction : @trx})
		.then (row) =>
			if !row
				throw new Error "Cannot find typearea with id='#{@typeAreaId}'"

			@typeArea = row

			deferred.resolve()
		.done()

		return deferred.promise

	getBlocks : ->
		if @blocks?
			return @blocks

		deferred = Q.defer()

		@db.sql "
			select
				block_id,
				type,
				noindex::int::text,
				txt.value as text_value,
				row_number() over() as position
			from
				typearea_block
				inner join typearea_block_text txt using(block_id)
			where
				typearea_id = :typeAreaId
				and deleted_at is null
			order by
				sort asc
		", {
			typeAreaId : @typeAreaId
		}
		.then (rows) =>
			@blocks = rows

			if !@blocks.length && @form
				@blocks.push {
					block_id : 'new_0'
					type : 'text'
					position : 1
				}

			deferred.resolve @blocks
		.done()

		return deferred.promise

	getTypes : () ->
		return ['text']

	isNewKey : (key) ->
		if /^new_/.test(key)
			return true

		return false

	getValues : ->
		key = @getNamePrefix()
		if key of @form.attributes
			values = @form.attributes[key]

			if '__tmp' of values
				delete values['__tmp']

			return values

		return {}

	getNamePrefix : ->
		return "typearea_#{@prefix}"

	validateRequiredFields : ->
		for key, block of @getValues()

			name = "#{@getNamePrefix()}[#{key}]"

			if !('type' of block) || !('position' of block)
				@form.addError name, 'incorrectRow', @i18n.__('Row is incorrect')
				continue

			switch block.type
				when "text"
					if !('value' of block)
						@form.addError name, 'incorrectRow', @i18n.__('Row is incorrect')

				else
					@form.addError name, 'unknownBlockType', @i18n.__('Unknown block type')

module.exports = TypeArea