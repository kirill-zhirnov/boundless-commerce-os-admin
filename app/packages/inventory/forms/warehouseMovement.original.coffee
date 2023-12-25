pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'
validator = require 'validator'
thumbnailUrl = pathAlias '@p-cms/modules/thumbnail/url'
moolah = require 'moolah'

class WarehouseMovement extends Form
	constructor: (options = {}) ->
		super

		@trx = null
		@items = {}

	getRules: ->
		return [
			['from_location_id, to_location_id', 'inOptions', {options: 'location'}]
			['from_location_id', 'required'],
			['from_location_id, to_location_id', 'validateWarehouses'],
			['items', 'validateItems'],
			['status', 'validateTransferStatus']
			['status', 'validateTrackInventorySettings']
			['movement_comment, qty', 'safe']
		]

	loadRecord : ->
		out = null
		return @getModel('transfer').findException({
			include : [
				{
					model : @getModel('inventoryMovement')
					as : 'completedMovement'
				},
				{
					model : @getModel('inventoryMovement')
					as : 'cancelledMovement'
				}
			]
			where :
				transfer_id : @pk
		})
		.then (row) =>
			out = row

			return @loadItemsByTransfer out
		.then (items) =>
			@items = items

			return out

	loadItemsByTransfer : (transfer) ->
		return @loadItems transfer.transfer_id, transfer.from_location_id

	loadItems : (transferId, locationId) ->
		deferred = Q.defer()

		@getDb().sql "
			select
				transfer_item.item_id,
				transfer_item.qty as diff_qty,
				inventory_stock.available_qty,
				vw_inventory_item.price,
				vw_inventory_item.img_path,
				vw_inventory_item.img_width,
				vw_inventory_item.img_height,
				vw_inventory_item.product_title,
				vw_inventory_item.variant_title,
				vw_inventory_item.product_sku,
				vw_inventory_item.variant_sku
			from
				transfer_item
				inner join vw_inventory_item using (item_id)
				left join inventory_stock on
					inventory_stock.item_id = transfer_item.item_id
					and inventory_stock.location_id = :location
			where
				transfer_id = :id
		", {
			id : transferId
			location : locationId
		}
		.then (rows) =>
			items = {}
			for row in rows
				item = _.pick row, ['item_id', 'available_qty', 'diff_qty', 'price', 'product_title', 'variant_title', 'prodcut_sku', 'variant_sku']

				item.totalPrice = moolah(row.price).times(row.diff_qty).float()

				item.thumb200 = thumbnailUrl.getAttrs(@getInstanceRegistry(), {
					path : row.img_path
					width : row.img_width
					height : row.img_height
				}, 'scaled', 's')

				items[item.item_id] = item

			deferred.resolve items
		.catch (e) ->
			deferred.reject e
		.done()

		return deferred.promise

	save: ->
		deferred = Q.defer()

		Q @getDb().transaction({autocommit : false})
		.then (t) =>
			@trx = t

			if @getSafeAttr('status') == 'completed'
				return @createMovement()
		.then (movement) =>
			attrs = @getSafeAttrs()

			savingAttrs = _.pick attrs, [
				'status',
				'from_location_id',
				'to_location_id',
				'movement_comment'
			]

			if movement
				savingAttrs.completed_movement_id = movement.movement_id

			if !@record
				@record = @getModel('transfer').build()

			@record.setAttributes savingAttrs

			return @record.save({transaction: @trx})
		.then () =>
			return @saveTransferItems @record, _.keys(@getSafeAttr('items'))
		.then () =>
			return @trx.commit()
		.then () =>
			deferred.resolve()
		.catch (e) =>
			Q()
			.then () =>
				if @trx
					return @trx.rollback()
			.then () =>
				deferred.reject e
			.done()
		.done()

		return deferred.promise

	createMovement : ->
		deferred = Q.defer()

		movement = null
		@getDb().sql "
			insert into inventory_movement
				(reason_id, person_id)
			select
				option_id,
				:person
			from
				inventory_option
			where
				category = 'systemChangeQty'
				and alias = 'warehouseMovement'
			returning *
		", {
			person : @getUser().getId()
		}, {transaction : @trx}
		.then (row) =>
			movement = row

			return @moveItems movement
		.then () =>
			deferred.resolve movement
		.catch (e) ->
			deferred.reject e
		.done()

		return deferred.promise

	moveItems : (movement) ->
		return @getModel('inventoryMovementItem').performWarehouseTransfer(
			movement.movement_id,
			@getSafeAttr('qty'),
			@getSafeAttr('from_location_id'),
			@getSafeAttr('to_location_id'),
			@trx
		)

	saveTransferItems: (transferRow, itemsIds) ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		@getDb().sql "
			delete from
				transfer_item
			where
				transfer_id = :transferId
				and item_id not in (:ids)
		", {
			transferId: transferRow.transfer_id,
			ids: itemsIds
		}, {
			transaction: @trx
		}
		.then () =>
			f = Q()

			for itemId in itemsIds
				do (itemId) =>
					f = f.then () =>
						return @getDb().sql "
							insert into transfer_item
								(transfer_id, item_id, qty)
							values
								(:transferId, :itemId, :qty)
							on conflict (transfer_id, item_id)
							do update
								set
									qty = :qty
								where
									transfer_item.item_id = :itemId
									and transfer_item.transfer_id = :transferId
						", {
							transferId: transferRow.transfer_id,
							itemId: itemId,
							qty: attrs.qty[itemId]
						}, {
							transaction: @trx
						}

			return f
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.reject e
		.done()

		return deferred.promise

	rawOptions: ->
		return {
			location : @getModel('inventoryLocation').getWarehouseOptions @getEditingLang().lang_id
			status : @getModel('transfer').getStatusOptions @getI18n()
		}

	getTplData: ->
		deferred = Q.defer()

		super
		.then (data) =>
			data.attrs.items = @items

			deferred.resolve data
		.done()

		return deferred.promise

	validateItems: (value, options, key, attributes, form) ->
		if !attributes.items? || !attributes.qty?
			@addError 'item_errors', 'noItems', @getI18n().__('No items selected.')
			return

		if @hasErrors 'item_errors'
			return

		deferred = Q.defer()

		keys = _.keys attributes.items

		values = keys.reduce( ((str, current, index, arr) =>
			escapedVal = "(#{@getDb().escape(current)})"
			suffix = if (index + 1) < arr.length then ', ' else ''
			return "#{str}#{escapedVal}#{suffix}"
		), '' )

		@getDb().sql "
			select
				items.item_id,
				is_exists,
				available_qty,
				not_track_inventory,
				price,
				product_deleted,
				variant_deleted
			from
				(values #{values}) items(item_id)
				left join (
					select
						item_id::text,
						true as is_exists,
						inventory_stock.available_qty,
						not_track_inventory,
						price,
						product.deleted_at as product_deleted,
						variant.deleted_at as variant_deleted
					from
						inventory_stock
						inner join vw_inventory_item using (item_id)
						left join product using (product_id)
						left join variant using (variant_id)
					where
						inventory_stock.location_id = :fromLocationId
				) temp using (item_id)
		", {
			fromLocationId : attributes.from_location_id
		}
		.then (rows) =>
			for row in rows
				if !row.is_exists
					@addError "items[#{row.item_id}]", 'noItem', @getI18n().__('No such item at specified warehouse.')
					continue

				if row.product_deleted? || row.variant_deleted?
					@addError "items[#{row.item_id}]", 'itemDeleted', @getI18n().__('Item is deleted.')
					continue

				if row.not_track_inventory
					@addError "items[#{row.item_id}]", 'inventoryTrack', @getI18n().__('Inventory track is disabled for this item.')

				if !validator.isInt(attributes.qty[row.item_id], {min: 1})
					@addError "qty[#{row.item_id}]", 'invalidQty', @getI18n().__('Quantity should be integer and greater than 0.')
					continue

				reqQty = Number(attributes.qty[row.item_id])

				if Number(row.available_qty) < reqQty && attributes.status == 'completed'
					@addError "qty[#{row.item_id}]", 'invalidQty', @getI18n().__('No such quantity at warehouse.')
					continue

			deferred.resolve(true)
		.done()

		return deferred.promise

	validateWarehouses: (value, options, key, attributes, form) ->
		if attributes.status == 'completed' && attributes.to_location_id == ''
			@addError 'to_location_id', 'required', @getI18n().__('Value cannot be blank.')
			return

		if String(attributes.from_location_id) == String(attributes.to_location_id)
			@addError 'to_location_id', 'sameWarehouses', @getI18n().__('Warehouses should be different.')
			return

		return

	validateTransferStatus: (value, options, key, attributes, form) ->
		if !_.contains ['draft', 'completed'], value
			@addError 'item_errors', 'status', 'Invalid movement action.'
			return

		if @record && @record.status == 'completed'
			@addError 'item_errors', 'status', 'Status already completed.'
			return

	validateTrackInventorySettings : () ->
		deferred = Q.defer()

		@getInstanceRegistry().getSettings().get('inventory', 'trackInventory')
		.then (value) =>
			if value != true
				@addError 'item_errors', 'status', 'Inventory tracking is disabled.'

			deferred.resolve()
		.done()

		return deferred.promise

module.exports = WarehouseMovement
