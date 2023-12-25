pathAlias = require 'path-alias'
Q = require 'q'
MovementForm = pathAlias '@p-inventory/forms/warehouseMovement'

class WarehouseMovementCancel extends MovementForm
	getRules: ->
		return [
			['errors', 'validateTransfer']
			['errors', 'validateItems']
		]
	
	loadItemsByTransfer : (transfer) ->
		return @loadItems transfer.transfer_id, transfer.to_location_id
	
	save: ->
		deferred = Q.defer()

		Q @getDb().transaction({autocommit : false})
		.then (t) =>
			@trx = t
			
			return @createMovement()
		.then (movement) =>
			@record.setAttributes {
				status : 'cancelled'
				cancelled_movement_id : movement.movement_id
			}
			
			return @record.save({transaction: @trx})
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
	
	moveItems : (movement) ->
		qty = {}
		for itemId, item of @items
			qty[itemId] = item.diff_qty
			
		return @getModel('inventoryMovementItem').performWarehouseTransfer(
			movement.movement_id,
			qty,
			@record.to_location_id,
			@record.from_location_id,
			@trx
		)
		
	validateTransfer: (value, options, key, attributes, form) ->
		if !@record
			@addError 'errors', 'noTransfer', 'No such transfer'
			return
			
		if @record.status != 'completed'
			@addError 'errors', 'noTransfer', 'Transfer can be cancelled only if it has status "completed".'
			return
		
		return
										
	validateItems: (value, options, key, attributes, form) ->
		for itemId, row of @items
			title = row.product_title
			if row.variant_title
				title += ' ' + row.variant_title
				
				if Number(row.diff_qty) > Number(row.available_qty)
					@addError 'errors', 'noItems', @getI18n().__('Not enough qty at specified warehouse for %s. Available qty: %s.', [title, row.available_qty])
					continue

		return
		
module.exports = WarehouseMovementCancel
