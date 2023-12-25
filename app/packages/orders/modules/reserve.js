import _ from 'underscore';
import onEssenceChanged from '../../system/modules/onEssenceChanged';

export default class Reserve {
	constructor(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.trx = null;
		this.reserve = null;
		this.movement = null;
		this.basketItems = null;

		this.db = this.instanceRegistry.getDb();
		this.settings = this.instanceRegistry.getSettings();

		// Array of items, which Qty were changed.
		// It needs to trigger 'changeQty'
		this.itemsChangedQty = [];
	}

	setTrx(trx) {
		this.trx = trx;
		return this;
	}

	async setReserveCompleted(reserveId, personId, orderStatusChanged = null) {
		await this.loadReserveById(reserveId);

		if (this.reserve.completed_at !== null) {
			throw new Error(`Reserve #'${this.reserve.reserve_id}' has already been completed!`);
		}
		this.reserve.set({completed_at: this.db.fn('now')});
		await this.reserve.save({transaction: this.trx});

		let props = null;
		if (orderStatusChanged) {
			props = {
				orderStatusFrom: orderStatusChanged.from,
				orderStatusTo: orderStatusChanged.to
			};
		}
		await this.createInventoryMovement(personId, 'systemChangeQty', 'reservedToOutside', props);

		await this.moveItemsToOutside();
		await this.rmEmptyInventoryMovement();
	}

	async setReserveUncompleted(reserveId, personId, orderStatusChanged = null) {
		await this.loadReserveById(reserveId);

		if ((this.reserve.completed_at == null))
			throw new Error(`Reserve #'${this.reserve.reserve_id}' has already marked as uncompleted.`);

		this.reserve.set({completed_at: null});
		await this.reserve.save({transaction: this.trx});

		let props = null;
		if (orderStatusChanged) {
			props = {
				orderStatusFrom: orderStatusChanged.from,
				orderStatusTo: orderStatusChanged.to
			};
		}

		await this.createInventoryMovement(personId, 'systemChangeQty', 'outsideToReserved', props);
		await this.moveItemsToReservedFromOutside();
		await this.rmEmptyInventoryMovement();
	}

	async createReserveByBasket(orderId, basketId, personId, reserveCompleted = false, orderStatusChanged = null) {
		this.itemsChangedQty = [];

		const reserveProps = {order_id: orderId};
		if (reserveCompleted) {
			reserveProps.completed_at = this.db.fn('now');
		}

		await this.createReserve(reserveProps);
		let props = null;
		if (orderStatusChanged) {
			props = {
				orderStatusFrom: orderStatusChanged.from,
				orderStatusTo: orderStatusChanged.to
			};
		}

		const movement = {
			category: 'systemChangeQty',
			alias: 'availableToReserve'
		};

		if (reserveCompleted) {
			Object.assign(movement, {
				category: 'systemChangeQty',
				alias: 'availableToOutside'
			});
		}

		await this.createInventoryMovement(personId, movement.category, movement.alias, props, orderId);

		this.basketItems = await this.loadBasketItems(basketId);

		await this.reserveBasketItems(reserveCompleted);
		await this.makeBasketInactive(basketId);
		await this.rmEmptyInventoryMovement();
		await this.triggerQtyChanged();

		return this.reserve;
	}

	async createInventoryMovement(personId, category = 'systemChangeQty', alias = 'availableToReserve', props = null, orderId = null) {
		if (!orderId && this.reserve && this.reserve.order_id) {
			orderId = this.reserve.order_id;
		}

		this.movement = await this.db.model('inventoryMovement')
			.createByReason(category, alias, personId, this.reserve.reserve_id, props, null, this.trx, orderId)
		;
	}

	async reserveBasketItems(reserveCompleted = false) {
		for (const item of this.basketItems) {
			//@ts-ignore
			if (item.trackInventory) {
				await this.reserveStockItem(item.item_id, item.qty, item.item_price_id, null, reserveCompleted);
			} else {
				await this.createReserveItem(null, null, item.item_id, item.qty, item.item_price_id, reserveCompleted);
			}
		}
	}

	async reserveItemByIdAndOrder(orderId, personId, itemId, qty = 1, priceId = null, basicPrice = null, finalPrice = null, discountAmount = null, discountPercent = null) {
		this.itemsChangedQty = [];

		const reserve = await this.db.model('reserve').findOne({
			where: {
				order_id: orderId
			},
			transaction: this.trx
		});

		if (!reserve) {
			throw new Error(`Reserve not found, order_id: '${orderId}'!`);
		}

		this.reserve = reserve;
		await this.reserveItemById(reserve.reserve_id, personId, itemId, qty, priceId, basicPrice, finalPrice, discountAmount, discountPercent);
		await this.triggerQtyChanged();
	}

	async reserveItemById(reserveId, personId, itemId, qty = 1, priceId = null, basicPrice = null, finalPrice = null, discountAmount = null, discountPercent = null) {
		await this.loadReserveById(reserveId);
		await this.createInventoryMovement(personId);

		const item = await this.loadItemForReserve(itemId);
		const itemPrice = await this.db.model('itemPrice')
			.build()
			.set({
				price_id: priceId,
				basic_price: basicPrice,
				final_price: finalPrice || basicPrice,
				discount_amount: discountAmount,
				discount_percent: discountPercent
			})
			.save({transaction: this.trx})
		;

		if (item.trackInventory) {
			await this.reserveStockItem(item.item_id, qty, itemPrice.item_price_id);
		} else {
			await this.createReserveItem(null, null, item.item_id, qty, itemPrice.item_price_id);
		}

		await this.rmEmptyInventoryMovement();
		await this.reCalcOrderMarkUp();
	}

	async reserveStockItem(itemId, qty, itemPriceId, locationId = null, reserveCompleted = false) {
		let locationSql = '';
		const params = {
			item: itemId
		};

		if (locationId) {
			params.location = locationId;
			locationSql = 'and s.location_id = :location';
		}

		let needToReserve = qty;
		const rows = await this.db.sql(`
			select
				s.stock_id,
				s.location_id,
				s.available_qty,
				s.item_id
			from
				inventory_stock s
				inner join inventory_location l using(location_id)
				inner join warehouse w using(warehouse_id)
			where
				s.item_id = :item
				and s.available_qty > 0
				${locationSql}
			order by w.sort
		`, params, {
			transaction: this.trx
		});


		for (const row of rows) {
			const writeOffQty = Math.min(needToReserve, row.available_qty);
			await this.createReserveItem(row.stock_id, row.location_id, row.item_id, writeOffQty, itemPriceId, reserveCompleted);

			needToReserve -= writeOffQty;
			if (needToReserve === 0) {
				break;
			}
		}

		if (needToReserve > 0) {
			throw {
				code: 'notEnoughStock',
				itemId,
				requestedQty: qty,
				shortage: needToReserve
			};
		}
	}

	async createReserveItem(stockId, locationId, itemId, qty, itemPriceId, isCompleted = false) {
		const reservedQty = isCompleted ? 0 : qty;

		const where = {
			reserve_id: this.reserve.reserve_id,
			item_id: itemId
		};
		if (stockId) {
			where.stock_id = stockId;
		}

		const reserveItem = await this.db.model('reserveItem').findOne({
			where,
			transaction: this.trx
		});

		if (reserveItem) {
			await reserveItem
				.set({
					qty: reserveItem.qty + qty,
					completed_at: isCompleted ? this.db.fn('now') : null
				})
				.save({transaction: this.trx});
		} else {
			await this.db.model('reserveItem').build()
				.set({
					reserve_id: this.reserve.reserve_id,
					stock_id: stockId,
					item_id: itemId,
					qty: qty,
					item_price_id: itemPriceId,
					completed_at: isCompleted ? this.db.fn('now') : null
				})
				.save({transaction: this.trx});
		}

		if (stockId !== null) {
			try {
				await this.db.sql(`
					update
						inventory_stock
					set
						available_qty = available_qty - :qty,
						reserved_qty = reserved_qty + :reservedQty
					where
						stock_id = :stock
					`, {
						qty,
						reservedQty,
						stock: stockId
					}, {
						transaction: this.trx
					});
			} catch (e) {
				throw {
					code: 'notEnoughStock',
					itemId,
					requestedQty: qty
				};
			}

			if (!locationId) {
				throw new Error('If stockId specified, locationId cannot be empty!');
			}

			this.itemsChangedQty.push(itemId);

			await this.db.model('inventoryMovementItem')
				.build()
				.set({
					movement_id: this.movement.movement_id,
					item_id: itemId,
					from_location_id: locationId,
					to_location_id: locationId,
					available_qty_diff: qty * -1,
					reserved_qty_diff: reservedQty === 0 ? null : reservedQty
				})
				.save({transaction: this.trx});
		}
	}

	async loadItemForReserve(itemId) {
		const trackInventory = await this.getSettingTrackInventory();

		const rows = await this.db.sql(`
			select
				i.item_id,
				i.product_id,
				i.variant_id,
				i.custom_item_id,
				pg.not_track_inventory as product_not_track_inventory,
				pvg.not_track_inventory as variant_not_track_inventory
			from
				inventory_item i
				left join product p on p.product_id = i.product_id
				left join commodity_group pg on pg.group_id = p.group_id
				left join variant v on v.variant_id = i.variant_id
				left join product pv on v.product_id = pv.product_id
				left join commodity_group pvg on pvg.group_id = pv.group_id
			where
				i.item_id = :item
		`, {item: itemId}, {
			transaction: this.trx
		});

		const row = rows[0];
		if (!row) {
			throw new Error(`Item with ID='${itemId}' not found!`);
		}

		if (row.custom_item_id) {
			row.trackInventory = false;
		} else {
			row.trackInventory = this.db.model('inventoryItem').shallTrackInventoryByRow(trackInventory, row);
		}

		return row;
	}

	async loadBasketItems(basketId) {
		const trackInventory = await this.getSettingTrackInventory();

		const rows = await this.db.sql(`
			select
				bi.item_id,
				bi.qty,
				bi.item_price_id,
				i.product_id,
				i.variant_id,
				i.custom_item_id,
				pg.not_track_inventory as product_not_track_inventory,
				pvg.not_track_inventory as variant_not_track_inventory
			from
				basket_item bi
				inner join inventory_item i using(item_id)
				left join product p on i.product_id = p.product_id
				left join commodity_group pg on pg.group_id = p.group_id
				left join variant v on v.variant_id = i.variant_id
				left join product pv on pv.product_id = v.product_id
				left join commodity_group pvg on pvg.group_id = pv.group_id
			where
				bi.basket_id = :basket
				and bi.deleted_at is null
			order by
				bi.basket_item_id asc
		`, {
			basket: basketId
		}, {
			transaction: this.trx
		});

		const out = [];
		for (const row of rows) {
			const item = _.pick(row, ['item_id', 'qty', 'item_price_id']);

			if (row.custom_item_id) {
				//@ts-ignore
				item.trackInventory = false;
			} else {
				//@ts-ignore
				item.trackInventory = this.db.model('inventoryItem').shallTrackInventoryByRow(trackInventory, row);
			}

			out.push(item);
		}

		return out;
	}

	async loadReservedItemsByItemId(itemId, locationId = null) {
		const trackInventory = await this.getSettingTrackInventory();

		let locationSql = '';
		const params = {
			reserve: this.reserve.reserve_id,
			item: itemId,
			langId: 1
		};

		if (locationId) {
			locationSql = 'and s.location_id = :location';
			params.location = locationId;
		}

		const rows = await this.db.sql(`
			select
				ri.reserve_item_id,
				ri.item_id,
				ri.qty,
				ri.item_price_id,
				s.location_id,
				s.stock_id,
				vw.product_id,
				vw.variant_id,
				vw.custom_item_id,
				vw.type,
				vw.commodity_group -> 'not_track_inventory' as not_track_inventory
			from
				reserve_item ri
				inner join vw_inventory_item vw on vw.item_id = ri.item_id
				left join inventory_stock s on ri.stock_id = s.stock_id
			where
				ri.reserve_id = :reserve
				and ri.item_id = :item
				and (vw.lang_id = :langId or vw.lang_id is null)
				${locationSql}
		`, params, {
			transaction: this.trx
		});

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];

			let rowTrackInventory = false;
			if (trackInventory && row.type !== 'custom_item') {
				rowTrackInventory = !row.not_track_inventory;
			}

			//@ts-ignore
			row.trackInventory = rowTrackInventory;

			rows[i] = row;
		}

		return rows;
	}

	async loadReserveById(reserveId) {
		if (this.reserve) {
			return this.reserve;
		}

		const row = await this.db.model('reserve').findOne({
			where: {
				reserve_id: reserveId
			},

			transaction: this.trx
		});

		if (!row) {
			throw new Error(`Reserve with ID:'${reserveId}' not found!`);
		}

		this.reserve = row;
	}

//	movein separate method - to be able mock it in unit tests
	getSettingTrackInventory() {
		return this.settings.get('inventory', 'trackInventory');
	}

	async createReserve(props = {}) {
		this.reserve = await this.db.model('reserve').build()
			.set(props)
			.save({transaction: this.trx})
		;
	}

	async makeBasketInactive(basketId) {
		await this.db.model('basket').update({
			is_active: false
		}, {
			where: {
				basket_id: basketId
			},

			transaction: this.trx
		});
	}

//   Array items :
//	[
//	    {
//	        itemId : <id>,
//	        qty : <qty>,
//           locationId : <locationId>
//       }
//	]
	async bulkSetQty(reserveId, items, personId) {
		this.itemsChangedQty = [];

		await this.loadReserveById(reserveId);
		await this.createInventoryMovement(personId, 'systemChangeQty', 'reserveSetQty');

		for (const item of items) {
			await this.performSetQty(item.itemId, item.qty, item.locationId);
		}

		await this.rmEmptyInventoryMovement();
		await this.triggerQtyChanged();
	}

	async performSetQty(itemId, needQty, locationId = null) {
		const rows = await this.loadReservedItemsByItemId(itemId);

		if ((rows.length === 0) && (needQty > 0)) {
			throw new Error('Items array is empty!');
		}

		if (!rows.length) {
			return;
		}

		let trackInventory = null;
		let itemPriceId = null;
		let totalQty = 0;

		for (const row of rows) {
			if ((locationId === null) || ((locationId !== null) && (row.location_id === locationId))) {
				totalQty += row.qty;
			}

			itemPriceId = row.item_price_id;
			({trackInventory} = row);
		}

		const diff = needQty - totalQty;
		if (diff > 0) {
			if (trackInventory) {
				await this.reserveStockItem(itemId, diff, itemPriceId, locationId);
			} else {
				await this.createReserveItem(null, null, itemId, diff, itemPriceId);
			}
		} else if (diff < 0) {
			await this.reduceReservedStockItem(rows, diff * -1, locationId);
		}
	}

	async reduceReservedStockItem(reservedItemRows, needQtydiffQtyneedQtyToReduce, locationId = null) {
		for (const row of reservedItemRows) {
			const reduceQty = Math.min(needQtydiffQtyneedQtyToReduce, row.qty);
			await this.performReduceReservedItem(row, reduceQty);

			needQtydiffQtyneedQtyToReduce -= reduceQty;
			if (needQtydiffQtyneedQtyToReduce === 0) {
				break;
			}
		}

		if (needQtydiffQtyneedQtyToReduce > 0) {
			throw new Error('Cannot reduce reservedItems qty!');
		}
	}

	async performReduceReservedItem(item, reduceQty) {
		if (item.qty === reduceQty) {
			await this.db.sql('delete from reserve_item where reserve_item_id = :id', {
				id: item.reserve_item_id
			}, {
				transaction: this.trx
			});
		} else {
			await this.db.sql(`
				update
					reserve_item
				set
					qty = qty - :qty
				where
					reserve_item_id = :id
			`, {
				qty: reduceQty,
				id: item.reserve_item_id
			}, {
				transaction: this.trx
			});
		}

		if (item.trackInventory) {
			await this.db.sql(`
				update
					inventory_stock
				set
					available_qty = available_qty + :qty,
					reserved_qty = reserved_qty - :qty
				where
					stock_id = :stock
			`, {
				qty: reduceQty,
				stock: item.stock_id
			}, {
				transaction: this.trx
			});

			this.itemsChangedQty.push(item.item_id);
			await this.db.model('inventoryMovementItem')
				.build()
				.set({
					movement_id: this.movement.movement_id,
					item_id: item.item_id,
					from_location_id: item.location_id,
					to_location_id: item.location_id,
					available_qty_diff: reduceQty,
					reserved_qty_diff: reduceQty * -1
				})
				.save({transaction: this.trx})
			;
		}
	}

	async removeReservedItem(reserveId, itemId, personId) {
		this.itemsChangedQty = [];

		await this.loadReserveById(reserveId);
		await this.createInventoryMovement(personId, 'systemChangeQty', 'rmFromReserve');
		const rows = await this.loadReservedItemsByItemId(itemId);
		for (const row of rows) {
			await this.performRmReservedItem(row.reserve_item_id, row.qty, row.trackInventory, row.stock_id, row.location_id, row.item_id);
		}

		await this.reCalcOrderMarkUp();
		await this.triggerQtyChanged();
	}

	async reCalcOrderMarkUp() {
		if (this.reserve.order_id) {
			await this.db.model('orders').calcOrderTotalById(this.instanceRegistry, this.reserve.order_id, this.trx);
		}
	}

	async performRmReservedItem(reserveItemId, qty, trackInventory, stockId = null, locationId = null, itemId = null) {
		await this.db.model('reserveItem').destroy({
			where: {
				reserve_item_id: reserveItemId
			},
			transaction: this.trx
		});

		if (trackInventory) {
			await this.db.sql(`
				update
					inventory_stock
				set
					available_qty = available_qty + :qty,
					reserved_qty = reserved_qty - :qty
				where
					stock_id = :stock
			`, {
				qty,
				stock: stockId
			}, {
				transaction: this.trx
			});

			this.itemsChangedQty.push(itemId);

			await this.db.model('inventoryMovementItem')
				.build()
				.set({
					movement_id: this.movement.movement_id,
					item_id: itemId,
					from_location_id: locationId,
					to_location_id: locationId,
					available_qty_diff: qty,
					reserved_qty_diff: qty * -1
				})
				.save({transaction: this.trx})
			;
		}
	}

	async rmEmptyInventoryMovement() {
		const rows = await this.db.sql(`
			select
				count(*) as cnt
			from
				inventory_movement_item
			where
				movement_id = :movement
		`, {
			movement: this.movement.movement_id
		}, {transaction: this.trx});

		if (parseInt(rows[0].cnt) === 0) {
			await this.db.sql('delete from inventory_movement where movement_id = :movement', {
				movement: this.movement.movement_id
			}, {
				transaction: this.trx
			});
		}
	}

	async moveItemsToReservedFromOutside() {
		const items = await this.loadReservedItems();

		for (const item of items) {
			await this.moveItemToReservedFromOutside(item);
		}
	}

	async moveItemsToOutside() {
		const items = await this.loadReservedItems();
		for (const item of items) {
			await this.moveItemToOutside(item);
		}
	}

	async moveItemToReservedFromOutside(item) {
		if (item.completed_at == null) {
			throw new Error(`ReserveItem #'${item.reserve_item_id}' has already marked as uncompleted!`);
		}

		await this.db.model('reserveItem').update({
			completed_at: null
		}, {
			where: {
				reserve_item_id: item.reserve_item_id
			},
			transaction: this.trx
		});

		if (item.trackInventory) {
			await this.db.sql(`
				update
					inventory_stock
				set
					reserved_qty = reserved_qty + :qty
				where
					stock_id = :stock
			`, {
				qty: item.qty,
				stock: item.stock_id
			}, {
				transaction: this.trx
			});

			await this.db.model('inventoryMovementItem')
				.build()
				.set({
					movement_id: this.movement.movement_id,
					item_id: item.item_id,
					from_location_id: null,
					to_location_id: item.location_id,
					available_qty_diff: 0,
					reserved_qty_diff: item.qty * 1
				})
				.save({transaction: this.trx});
		}
	}

	async moveItemToOutside(item) {
		if (item.completed_at !== null) {
			throw new Error(`ReservedItem #'${item.reserve_item_id}' has already been completed!`);
		}

		await this.db.model('reserveItem').update({
			completed_at: this.db.fn('now')
		}, {
			where: {
				reserve_item_id: item.reserve_item_id
			},
			transaction: this.trx
		});

		if (item.trackInventory) {
			await this.db.sql(`
				update
					inventory_stock
				set
					reserved_qty = reserved_qty - :qty
				where
					stock_id = :stock
			`, {
				qty: item.qty,
				stock: item.stock_id
			}, {
				transaction: this.trx
			});

			await this.db.model('inventoryMovementItem')
				.build()
				.set({
					movement_id: this.movement.movement_id,
					item_id: item.item_id,
					from_location_id: item.location_id,
					to_location_id: null,
					available_qty_diff: 0,
					reserved_qty_diff: item.qty * -1
				})
				.save({transaction: this.trx})
			;
		}
	}


	async loadReservedItems() {
		const trackInventory = await this.getSettingTrackInventory();
		const InventoryItem = this.db.model('inventoryItem');


		const rows = await this.db.sql(`
			select
				ri.reserve_item_id,
				ri.item_id,
				ri.completed_at,
				s.stock_id,
				s.location_id,
				ri.qty,
				i.product_id,
				i.variant_id,
				pg.not_track_inventory as product_not_track_inventory,
				pvg.not_track_inventory as variant_not_track_inventory
			from
				reserve_item ri
				inner join inventory_item i on i.item_id = ri.item_id
				left join inventory_stock s on ri.stock_id = s.stock_id
				left join product p on i.product_id = p.product_id
				left join commodity_group pg on pg.group_id = p.group_id
				left join variant v on v.variant_id = i.variant_id
				left join product pv on pv.product_id = v.product_id
				left join commodity_group pvg on pvg.group_id = pv.group_id
			where
				ri.reserve_id = :reserve
		`, {reserve: this.reserve.reserve_id}, {transaction: this.trx});

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			rows[i].trackInventory = InventoryItem.shallTrackInventoryByRow(trackInventory, row);
		}

		return rows;
	}

	async triggerQtyChanged() {
		if (!this.itemsChangedQty.length) {
			return;
		}

		return onEssenceChanged.trigger(this.instanceRegistry, 'product', [], 'changeQty');
	}
}
