import Component from '../../../modules/component';
import onEssenceChanged from '../../system/modules/onEssenceChanged';

/**
 * Если заказ отменен - нам нужно перенести резерв товаров в корзину,
 * чтобы остатки снова вернулись на склад. Если товары находятся в резерве - остатки зарезервирвоаны под клиента.
 * Товары находящиеся в корзине - не зарезервированы. Это позволит сохранить список товаров в отмененном/возвращенном
 * заказе для последующей аналитики.
 */
export default class Reserve2Basket extends Component {
	constructor(env, orderId) {
		super(env);

		this.orderId = orderId;
		this.trx = null;

		this.movementProps = null;

		this.reserve = null;
		this.basket = null;
		this.movement = null;
	}

	async process() {
		if (!await this.findReserve())
			return false;

		await this.makeBasket();
		await this.makeMovement();

		await this.copyItemsToBasket();
		await this.moveItemsToStock();

		await this.getModel('inventoryMovement').destroyIfEmpty(this.movement.movement_id, this.trx);
		await this.saveBasketAtOrder();

		return true;
	}

	async saveBasketAtOrder() {
		await this.getModel('orders').update({
			basket_id: this.basket.basket_id
		}, {
			where: {
				order_id: this.orderId
			},
			transaction: this.trx
		});
	}

	async moveItemsToStock() {
		let qtyChanged = false;

		for (let reservedItem of await this.findReservedItems()) {
			if (reservedItem.type !== 'custom_item' && !reservedItem.not_track_inventory && reservedItem.stock_id) {
				await this.runItemMovement(reservedItem);

				qtyChanged = true;
			}
		}

		await this.getModel('inventoryMovement').update({
			order_id: this.orderId
		}, {
			where: {
				reserve_id: this.reserve.reserve_id
			},
			transaction: this.trx
		});

		await this.getModel('reserve').destroy({
			where: {
				reserve_id: this.reserve.reserve_id
			},
			transaction: this.trx
		});

		if (qtyChanged) {
			//не ждем изменений кол-ва товара - это будет в фоне
			this.triggerQtyChanged();
		}
	}

	async runItemMovement(reservedItem) {
		let reservedQty = reservedItem.qty;
		if (this.reserve.completed_at) {
			reservedQty = 0;
		}

		await this.getDb().sql(`
			update
				inventory_stock
			set
				available_qty = available_qty + :qty,
				reserved_qty = reserved_qty - :reservedQty
			where
				stock_id = :stock
		`, {
			qty: reservedItem.qty,
			reservedQty: reservedQty,
			stock: reservedItem.stock_id
		}, {
			transaction: this.trx
		});

		await this.getModel('inventoryMovementItem').create({
			movement_id: this.movement.movement_id,
			item_id: reservedItem.item_id,
			from_location_id: (this.reserve.completed_at) ? null : reservedItem.location_id,
			to_location_id: reservedItem.location_id,
			available_qty_diff: reservedItem.qty,
			reserved_qty_diff: (reservedQty) ? reservedItem.qty * -1 : null
		}, {
			transaction: this.trx
		});
	}

	async copyItemsToBasket() {
		const reservedRows = await this.getDb().sql(`
			select
				*
			from
				reserve_item
			where
				reserve_id = :reserve
			order by
				reserve_item_id asc
		`, {
			reserve: this.reserve.reserve_id
		}, {
			transaction: this.trx
		});

		for (const row of reservedRows) {
			await this.getDb().sql(`
				insert into basket_item
					(basket_id, item_id, qty, item_price_id)
				values
					(:basket, :itemId, :qty, :itemPriceId)
				on conflict (basket_id, item_id) do update
				set
					qty = basket_item.qty + :qty
			`, {
				basket: this.basket.basket_id,
				itemId: row.item_id,
				qty: row.qty,
				itemPriceId: row.item_price_id
			}, {
				transaction: this.trx
			});
		}
	}

	async makeBasket() {
		this.basket = await this.getModel('basket').create({
			person_id: null,
			is_active: false
		}, {
			transaction: this.trx
		});
	}

	async makeMovement() {
		let personId = null;
		if (this.getUser() && this.getUser().getId())
			personId = this.getUser().getId();

		let reasonAlias = 'rmFromReserve';
		if (this.reserve.completed_at) {
			reasonAlias = 'outsideToAvailable';
		}

		this.movement = await this.getModel('inventoryMovement').createByReason(
			'systemChangeQty',
			reasonAlias,
			personId,
			null,
			this.movementProps,
			null,
			this.trx,
			this.orderId
		);
	}

	async findReservedItems() {
		return await this.getDb().sql(`
			select
				reserve_item.*,
				vw.type,
				vw.commodity_group -> 'not_track_inventory' as not_track_inventory,
				inventory_stock.location_id
			from
				reserve_item
				inner join vw_inventory_item vw using(item_id)
				left join inventory_stock using(stock_id)
			where
				reserve_item.reserve_id = :reserve
				and (vw.lang_id = :langId or vw.lang_id is null)
			order by
				reserve_item.created_at asc
		`, {
			reserve: this.reserve.reserve_id,
			site: this.getSite().site_id,
			langId: this.getEditingLang().lang_id
		}, {
			transaction: this.trx
		});
	}

	async findReserve() {
		this.reserve = await this.getModel('reserve').findOne({
			where: {
				order_id: this.orderId
			},

			transaction: this.trx
		});

		return this.reserve;
	}

	async triggerQtyChanged() {
		await onEssenceChanged.trigger(this.instanceRegistry, 'product', [], 'changeQty');
	}

	setTrx(trx) {
		this.trx = trx;

		return this;
	}

	setMovementProps(props) {
		this.movementProps = props;

		return this;
	}
}