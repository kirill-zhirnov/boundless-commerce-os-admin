import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import _ from 'underscore';

export default function (sequelize, DataTypes) {
	class InventoryMovementItem extends ExtendedModel {
		static performWarehouseTransfer(movementId, items, locationFrom, locationTo, trx = null) {
			const deferred = Q.defer();

			let f = Q();

			const itemsIds = _.keys(items);

			for (let itemId of Array.from(itemsIds)) {
				(itemId => {
					return f = f.then(() => {
						const def = Q.defer();

						this.sequelize.sql('\
insert into inventory_movement_item \
(movement_id, item_id, from_location_id, to_location_id, available_qty_diff) \
values \
(:pk, :itemId, :locationFrom, :locationTo, :qty)\
', {
							pk: movementId,
							itemId,
							locationFrom,
							locationTo,
							qty: items[itemId]
						}, {
							transaction: trx
						})
							.then(() => {
								return this.sequelize.sql('\
update \
inventory_stock \
set \
available_qty = available_qty - :qty \
where \
item_id = :itemId \
and location_id = :locationFrom \
and available_qty >= :qty \
returning *\
', {
									itemId,
									locationFrom,
									qty: items[itemId]
								}, {
									transaction: trx
								});
							})
							.then(updatedRow => {
								if (!updatedRow.length) {
									throw new Error(`Cannot move '${itemId}' from '${locationFrom}' - not enough qty!`);
								}

								return this.sequelize.sql('\
insert into inventory_stock \
(location_id, item_id, available_qty) \
values \
(:locationTo, :itemId, :qty) \
on conflict (location_id, item_id) \
do update \
set \
available_qty = inventory_stock.available_qty + :qty \
where \
inventory_stock.location_id = :locationTo \
and inventory_stock.item_id = :itemId\
', {
									locationTo,
									itemId,
									qty: items[itemId]
								}, {
									transaction: trx
								});
							})
							.then(() => {
								return def.resolve();
							}).catch(e => def.reject(e));

						return def.promise;
					});
				})(itemId);
			}
			f
				.then(() => {
					return deferred.resolve();
				}).catch(e => {
					return deferred.reject(e);
				}).done();

			return deferred.promise;
		}
	}

	InventoryMovementItem.init({
		movement_item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		movement_id: {
			type: DataTypes.INTEGER
		},

		item_id: {
			type: DataTypes.INTEGER
		},

		from_location_id: {
			type: DataTypes.INTEGER
		},

		to_location_id: {
			type: DataTypes.INTEGER
		},

		available_qty_diff: {
			type: DataTypes.INTEGER
		},

		reserved_qty_diff: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'inventory_movement_item',
		modelName: 'inventoryMovementItem',
		sequelize
	});

	return InventoryMovementItem;
}