// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');
const validator = require('validator');
const thumbnailUrl = pathAlias('@p-cms/modules/thumbnail/url');
const moolah = require('moolah');

class WarehouseMovement extends Form {
	constructor(options) {
		if (options == null) { options = {}; }
		super(...arguments);

		this.trx = null;
		this.items = {};
	}

	getRules() {
		return [
			['from_location_id, to_location_id', 'inOptions', {options: 'location'}],
			['from_location_id', 'required'],
			['from_location_id, to_location_id', 'validateWarehouses'],
			['items', 'validateItems'],
			['status', 'validateTransferStatus'],
			['status', 'validateTrackInventorySettings'],
			['movement_comment, qty', 'safe']
		];
	}

	loadRecord() {
		let out = null;
		return this.getModel('transfer').findException({
			include : [
				{
					model : this.getModel('inventoryMovement'),
					as : 'completedMovement'
				},
				{
					model : this.getModel('inventoryMovement'),
					as : 'cancelledMovement'
				}
			],
			where : {
				transfer_id : this.pk
			}
		})
		.then(row => {
			out = row;

			return this.loadItemsByTransfer(out);
	}).then(items => {
			this.items = items;

			return out;
		});
	}

	loadItemsByTransfer(transfer) {
		return this.loadItems(transfer.transfer_id, transfer.from_location_id);
	}

	loadItems(transferId, locationId) {
		const deferred = Q.defer();

		this.getDb().sql(`\
select \
transfer_item.item_id, \
transfer_item.qty as diff_qty, \
inventory_stock.available_qty, \
vw_inventory_item.price, \
vw_inventory_item.img_path, \
vw_inventory_item.img_width, \
vw_inventory_item.img_height, \
vw_inventory_item.product_title, \
vw_inventory_item.variant_title, \
vw_inventory_item.product_sku, \
vw_inventory_item.variant_sku \
from \
transfer_item \
inner join vw_inventory_item using (item_id) \
left join inventory_stock on \
inventory_stock.item_id = transfer_item.item_id \
and inventory_stock.location_id = :location \
where \
transfer_id = :id\
`, {
			id : transferId,
			location : locationId
		})
		.then(rows => {
			const items = {};
			for (let row of Array.from(rows)) {
				const item = _.pick(row, ['item_id', 'available_qty', 'diff_qty', 'price', 'product_title', 'variant_title', 'prodcut_sku', 'variant_sku']);

				item.totalPrice = moolah(row.price).times(row.diff_qty).float();

				item.thumb200 = thumbnailUrl.getAttrs(this.getInstanceRegistry(), {
					path : row.img_path,
					width : row.img_width,
					height : row.img_height
				}, 'scaled', 's');

				items[item.item_id] = item;
			}

			return deferred.resolve(items);
	}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}

	save() {
		const deferred = Q.defer();

		Q(this.getDb().transaction({autocommit : false}))
		.then(t => {
			this.trx = t;

			if (this.getSafeAttr('status') === 'completed') {
				return this.createMovement();
			}
	}).then(movement => {
			const attrs = this.getSafeAttrs();

			const savingAttrs = _.pick(attrs, [
				'status',
				'from_location_id',
				'to_location_id',
				'movement_comment'
			]);

			if (movement) {
				savingAttrs.completed_movement_id = movement.movement_id;
			}

			if (!this.record) {
				this.record = this.getModel('transfer').build();
			}

			this.record.setAttributes(savingAttrs);

			return this.record.save({transaction: this.trx});
			}).then(() => {
			return this.saveTransferItems(this.record, _.keys(this.getSafeAttr('items')));
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

	createMovement() {
		const deferred = Q.defer();

		let movement = null;
		this.getDb().sql(`\
insert into inventory_movement \
(reason_id, person_id) \
select \
option_id, \
:person \
from \
inventory_option \
where \
category = 'systemChangeQty' \
and alias = 'warehouseMovement' \
returning *\
`, {
			person : this.getUser().getId()
		}, {transaction : this.trx})
		.then(row => {
			movement = row;

			return this.moveItems(movement);
	}).then(() => {
			return deferred.resolve(movement);
		}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}

	moveItems(movement) {
		return this.getModel('inventoryMovementItem').performWarehouseTransfer(
			movement.movement_id,
			this.getSafeAttr('qty'),
			this.getSafeAttr('from_location_id'),
			this.getSafeAttr('to_location_id'),
			this.trx
		);
	}

	saveTransferItems(transferRow, itemsIds) {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();

		this.getDb().sql(`\
delete from \
transfer_item \
where \
transfer_id = :transferId \
and item_id not in (:ids)\
`, {
			transferId: transferRow.transfer_id,
			ids: itemsIds
		}, {
			transaction: this.trx
		})
		.then(() => {
			let f = Q();

			for (let itemId of Array.from(itemsIds)) {
				(itemId => {
					return f = f.then(() => {
						return this.getDb().sql(`\
insert into transfer_item \
(transfer_id, item_id, qty) \
values \
(:transferId, :itemId, :qty) \
on conflict (transfer_id, item_id) \
do update \
set \
qty = :qty \
where \
transfer_item.item_id = :itemId \
and transfer_item.transfer_id = :transferId\
`, {
							transferId: transferRow.transfer_id,
							itemId,
							qty: attrs.qty[itemId]
						}, {
							transaction: this.trx
						});
				});
				})(itemId);
			}

			return f;
	}).then(() => {
			return deferred.resolve();
		}).catch(e => {
			return deferred.reject(e);
		}).done();

		return deferred.promise;
	}

	rawOptions() {
		return {
			location : this.getModel('inventoryLocation').getWarehouseOptions(this.getEditingLang().lang_id),
			status : this.getModel('transfer').getStatusOptions(this.getI18n())
		};
	}

	getTplData() {
		const deferred = Q.defer();

		super.getTplData(...arguments)
		.then(data => {
			data.attrs.items = this.items;

			return deferred.resolve(data);
	}).done();

		return deferred.promise;
	}

	validateItems(value, options, key, attributes, form) {
		if ((attributes.items == null) || (attributes.qty == null)) {
			this.addError('item_errors', 'noItems', this.getI18n().__('No items selected.'));
			return;
		}

		if (this.hasErrors('item_errors')) {
			return;
		}

		const deferred = Q.defer();

		const keys = _.keys(attributes.items);

		const values = keys.reduce( ((str, current, index, arr) => {
			const escapedVal = `(${this.getDb().escape(current)})`;
			const suffix = (index + 1) < arr.length ? ', ' : '';
			return `${str}${escapedVal}${suffix}`;
		}
		), '' );

		this.getDb().sql(`\
select \
items.item_id, \
is_exists, \
available_qty, \
not_track_inventory, \
price, \
product_deleted, \
variant_deleted \
from \
(values ${values}) items(item_id) \
left join ( \
select \
item_id::text, \
true as is_exists, \
inventory_stock.available_qty, \
not_track_inventory, \
price, \
product.deleted_at as product_deleted, \
variant.deleted_at as variant_deleted \
from \
inventory_stock \
inner join vw_inventory_item using (item_id) \
left join product using (product_id) \
left join variant using (variant_id) \
where \
inventory_stock.location_id = :fromLocationId \
) temp using (item_id)\
`, {
			fromLocationId : attributes.from_location_id
		})
		.then(rows => {
			for (let row of Array.from(rows)) {
				if (!row.is_exists) {
					this.addError(`items[${row.item_id}]`, 'noItem', this.getI18n().__('No such item at specified warehouse.'));
					continue;
				}

				if ((row.product_deleted != null) || (row.variant_deleted != null)) {
					this.addError(`items[${row.item_id}]`, 'itemDeleted', this.getI18n().__('Item is deleted.'));
					continue;
				}

				if (row.not_track_inventory) {
					this.addError(`items[${row.item_id}]`, 'inventoryTrack', this.getI18n().__('Inventory track is disabled for this item.'));
				}

				if (!validator.isInt(attributes.qty[row.item_id], {min: 1})) {
					this.addError(`qty[${row.item_id}]`, 'invalidQty', this.getI18n().__('Quantity should be integer and greater than 0.'));
					continue;
				}

				const reqQty = Number(attributes.qty[row.item_id]);

				if ((Number(row.available_qty) < reqQty) && (attributes.status === 'completed')) {
					this.addError(`qty[${row.item_id}]`, 'invalidQty', this.getI18n().__('No such quantity at warehouse.'));
					continue;
				}
			}

			return deferred.resolve(true);
	}).done();

		return deferred.promise;
	}

	validateWarehouses(value, options, key, attributes, form) {
		if ((attributes.status === 'completed') && (attributes.to_location_id === '')) {
			this.addError('to_location_id', 'required', this.getI18n().__('Value cannot be blank.'));
			return;
		}

		if (String(attributes.from_location_id) === String(attributes.to_location_id)) {
			this.addError('to_location_id', 'sameWarehouses', this.getI18n().__('Warehouses should be different.'));
			return;
		}

	}

	validateTransferStatus(value, options, key, attributes, form) {
		if (!_.contains(['draft', 'completed'], value)) {
			this.addError('item_errors', 'status', 'Invalid movement action.');
			return;
		}

		if (this.record && (this.record.status === 'completed')) {
			this.addError('item_errors', 'status', 'Status already completed.');
			return;
		}
	}

	validateTrackInventorySettings() {
		const deferred = Q.defer();

		this.getInstanceRegistry().getSettings().get('inventory', 'trackInventory')
		.then(value => {
			if (value !== true) {
				this.addError('item_errors', 'status', 'Inventory tracking is disabled.');
			}

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}
}

module.exports = WarehouseMovement;
