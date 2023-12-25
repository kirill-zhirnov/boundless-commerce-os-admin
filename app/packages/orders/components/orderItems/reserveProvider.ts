import {IInstanceRegistry} from '../../../../@types/registry/instanceRegistry';
import {IServerClientRegistry} from '../../../../@types/registry/serverClientRegistry';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import {IItemsCriteria, IOrderItemsPrice, IQtyUpdate} from '../orderItems';
import Reserve from '../../modules/reserve';
import ExtendedSequelize from '../../../../modules/db/sequelize';
import {IReserveItemModel} from '../../../inventory/models/reserveItem';
import squel from '../../../../modules/db/squel';
import {TOrdersItem} from '../../../../@types/orders';

export default class OrderItemsReserveProvider {
	protected db: ExtendedSequelize;

	protected clientRegistry?: IServerClientRegistry;

	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected order: IOrdersModel
	) {
		this.db = this.instanceRegistry.getDb();
	}

	async addItem(itemId: number, qty: number, price: IOrderItemsPrice) {
		if (!this.order.reserve) {
			throw new Error('Reserve relation is empty');
		}

		const trx = await this.db.transaction({autocommit: false});
		try {
			const reserve = new Reserve(this.instanceRegistry);
			reserve.setTrx(trx);

			await reserve.reserveItemById(
				this.order.reserve.reserve_id,
				this.clientRegistry!.getUser().getId(),
				itemId,
				qty,
				price.price_id,
				price.basic_price,
				price.final_price,
				price.discount_amount,
				price.discount_percent
			);
			await trx.commit();
		} catch (e) {
			await trx.rollback();

			throw e;
		}

		await this.reCalcOrderTotal();
	}

	async getItems(criteria: IItemsCriteria|null = null): Promise<TOrdersItem[]> {
		if (!this.order.reserve) {
			throw new Error('Reserve relation is empty');
		}

		const query = this.getBasicFindItemsQuery();
		if (criteria) {
			if (criteria.item_id) {
				const itemIds = Array.isArray(criteria.item_id) ? criteria.item_id : [criteria.item_id];
				query.where(`reserve_item.item_id in (${this.db.escapeIn(itemIds)})`);
			}

			if (criteria.product_id) {
				query.where('vw.product_id = ?', criteria.product_id);
			}

			if (criteria.variant_id) {
				query.where('vw.variant_id = ?', criteria.variant_id);
			}

			if (criteria.custom_item_id) {
				query.where('vw.custom_item_id = ?', criteria.custom_item_id);
			}
		}

		const rows = await this.db.execSquel<TOrdersItem>(query);

		const groupedRows = [];
		for (const row of rows) {
			const index = groupedRows.findIndex(({item_id}) => item_id === row.item_id);
			if (index !== -1) {
				groupedRows[index].qty += row.qty;
			} else {
				groupedRows.push(row);
			}
		}

		//@ts-ignore
		const out = await (this.db.model('inventoryItem')).prepareVwInventoryItems(
			groupedRows,
			true,
			this.clientRegistry!.getEditingLang().lang_id
		) as unknown as TOrdersItem[];

		return out;
	}

	async rmItems(itemIds: number[]) {
		if (!this.order.reserve) {
			throw new Error('Reserve relation is empty');
		}

		const trx = await this.db.transaction({autocommit: false});
		try {
			const reserve = new Reserve(this.instanceRegistry);
			reserve.setTrx(trx);

			for (const itemId of itemIds) {
				await reserve.removeReservedItem(this.order.reserve.reserve_id, itemId, this.clientRegistry!.getUser().getId());
			}

			await trx.commit();
		} catch (e) {
			await trx.rollback();

			throw e;
		}

		await this.reCalcOrderTotal();
	}

	async updatePrice(itemId: number, price: Partial<IOrderItemsPrice>, stockId: number|null = null) {
		if (!this.order.reserve) {
			throw new Error('Reserve relation is empty');
		}

		const where: {reserve_id: number, item_id: number, stock_id?: number} = {
			reserve_id: this.order.reserve.reserve_id,
			item_id: itemId
		};

		if (stockId) {
			where.stock_id = stockId;
		}

		const reserveItems = await this.db.model('reserveItem').findAll({
			where
		}) as unknown as IReserveItemModel[];

		//the same item might be added multiple times due to the stock_id - on multiple stocks:
		for (const item of reserveItems) {
			await this.db.model('itemPrice').update(price, {
				where: {
					item_price_id: item.item_price_id
				}
			});

			// we need it to trigger a trigger to recalculate reserve_item.total_price:
			await this.db.sql(`
				update
					reserve_item
				set
					item_price_id = :itemPriceId
				where
					reserve_item_id = :reserveItemId
			`, {
				reserveItemId: item.reserve_item_id,
				itemPriceId: item.item_price_id
			});
		}

		await this.reCalcOrderTotal();
	}

	async bulkSetQty(qty: IQtyUpdate[]) {
		if (!this.order.reserve) {
			throw new Error('Reserve relation is empty');
		}

		const trx = await this.db.transaction({autocommit: false});
		try {
			const reserve = new Reserve(this.instanceRegistry);
			reserve.setTrx(trx);

			await reserve.bulkSetQty(this.order.reserve.reserve_id, qty, this.clientRegistry!.getUser().getId());

			await trx.commit();
		} catch (e) {
			await trx.rollback();

			throw e;
		}

		await this.reCalcOrderTotal();
	}

	setClientRegistry(clientRegistry: IServerClientRegistry) {
		this.clientRegistry = clientRegistry;
		return this;
	}

	protected async reCalcOrderTotal() {
		await (this.db.model('orders') as IOrdersModelStatic).calcOrderTotalById(this.instanceRegistry, this.order.order_id);
	}

	protected getBasicFindItemsQuery() {
		return squel.select()
			.field('reserve_item.reserve_item_id')
			.field('reserve_item.reserve_id')
			.field('reserve_item.stock_id')
			.field('reserve_item.qty')
			.field('reserve_item.created_at')
			.field('reserve_item.completed_at')
			.field('item_price.*')
			.field('vw.*')

			.from('reserve_item')
			.join('vw_inventory_item', 'vw', 'vw.item_id = reserve_item.item_id')
			.left_join('item_price', null, 'item_price.item_price_id = reserve_item.item_price_id')

			.where('reserve_item.reserve_id = ?', this.order.reserve.reserve_id)
			.where('(vw.lang_id = ? or vw.lang_id is null)', this.clientRegistry!.getEditingLang().lang_id)
			.order('reserve_item.reserve_item_id asc', null)
		;
	}
}