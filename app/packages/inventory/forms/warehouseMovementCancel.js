// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Q = require('q');
const MovementForm = pathAlias('@p-inventory/forms/warehouseMovement');

class WarehouseMovementCancel extends MovementForm {
	getRules() {
		return [
			['errors', 'validateTransfer'],
			['errors', 'validateItems']
		];
	}
	
	loadItemsByTransfer(transfer) {
		return this.loadItems(transfer.transfer_id, transfer.to_location_id);
	}
	
	save() {
		const deferred = Q.defer();

		Q(this.getDb().transaction({autocommit : false}))
		.then(t => {
			this.trx = t;
			
			return this.createMovement();
	}).then(movement => {
			this.record.setAttributes({
				status : 'cancelled',
				cancelled_movement_id : movement.movement_id
			});
			
			return this.record.save({transaction: this.trx});
		}).then(() => {
			return this.trx.commit();
		}).then(() => {
			return deferred.resolve();
		}).catch(e => {
			return Q()
			.then(() => {
				if (this.trx) {
					return this.trx.rollback();
				}
		}).then(() => {
				return deferred.reject(e);
				}).done();
		}).done();

		return deferred.promise;
	}
	
	moveItems(movement) {
		const qty = {};
		for (let itemId in this.items) {
			const item = this.items[itemId];
			qty[itemId] = item.diff_qty;
		}
			
		return this.getModel('inventoryMovementItem').performWarehouseTransfer(
			movement.movement_id,
			qty,
			this.record.to_location_id,
			this.record.from_location_id,
			this.trx
		);
	}
		
	validateTransfer(value, options, key, attributes, form) {
		if (!this.record) {
			this.addError('errors', 'noTransfer', 'No such transfer');
			return;
		}
			
		if (this.record.status !== 'completed') {
			this.addError('errors', 'noTransfer', 'Transfer can be cancelled only if it has status "completed".');
			return;
		}
		
	}
										
	validateItems(value, options, key, attributes, form) {
		for (let itemId in this.items) {
			const row = this.items[itemId];
			let title = row.product_title;
			if (row.variant_title) {
				title += ' ' + row.variant_title;
				
				if (Number(row.diff_qty) > Number(row.available_qty)) {
					this.addError('errors', 'noItems', this.getI18n().__('Not enough qty at specified warehouse for %s. Available qty: %s.', [title, row.available_qty]));
					continue;
				}
			}
		}

	}
}
		
module.exports = WarehouseMovementCancel;
