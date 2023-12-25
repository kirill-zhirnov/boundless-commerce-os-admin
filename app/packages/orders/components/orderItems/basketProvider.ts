import {IItemsCriteria, IOrderItemsPrice, IQtyUpdate} from '../orderItems';
import {IInstanceRegistry} from '../../../../@types/registry/instanceRegistry';
import ExtendedSequelize from '../../../../modules/db/sequelize';
import {Transaction} from 'sequelize';
import onEssenceChanged from '../../../system/modules/onEssenceChanged';
import {IBasketItemModel, IBasketItemModelStatic} from '../../models/basketItem';
import squel from '../../../../modules/db/squel';
import {TOrdersItem} from '../../../../@types/orders';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import {TPublishingStatus} from '../../../../@types/db';

export default class OrderItemsBasketProvider {
	protected db: ExtendedSequelize;
	protected trx?: Transaction|null;
	protected order?: IOrdersModel;

	constructor(
		protected instanceRegistry: IInstanceRegistry,
	) {
		this.db = this.instanceRegistry.getDb();
	}

	async addItem(basketId: number, itemId: number, qty: number, price: IOrderItemsPrice) {
		// const trx = await this.db.transaction({autocommit: false});
		//@ts-ignore
		await this.db.model('basketItem').addItem({
			basketId,
			itemId,
			qty,
			priceId: price.price_id,
			basicPrice: price.basic_price,
			finalPrice: price.final_price,
			discountAmount: price.discount_amount,
			discountPercent: price.discount_percent
		});
		// await trx.commit();

		await this.reCalcOrderTotal();
		await onEssenceChanged.trigger(this.instanceRegistry, 'basketItem', [itemId], 'add');
	}

	async getItems(basketId: number, langId: number, criteria: IItemsCriteria|null = null): Promise<TOrdersItem[]> {
		const query = this.getBasicFindItemsQuery(basketId, langId);

		if (criteria) {
			if (criteria.item_id) {
				const itemIds = Array.isArray(criteria.item_id) ? criteria.item_id : [criteria.item_id];
				query.where(`basket_item.item_id in (${this.db.escapeIn(itemIds)})`);
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

		const rows = await this.db.execSquel(query, {transaction: this.trx});

		//@ts-ignore
		const out = await this.db.model('inventoryItem').prepareVwInventoryItems(rows, true, langId) as unknown as TOrdersItem[];
		return out;
	}

	async rmItems(basketId: number, itemIds: number[]) {
		const BasketItemModel = this.db.model('basketItem') as unknown as IBasketItemModelStatic;

		for (const itemId of itemIds) {
			await BasketItemModel.safeDelete({
				where: {
					basket_id: basketId,
					item_id: itemId
				}
			});
		}

		await this.reCalcOrderTotal();
		await onEssenceChanged.trigger(this.instanceRegistry, 'basketItem', itemIds, 'remove');
	}

	async updatePrice(basketId: number, itemId: number, price: Partial<IOrderItemsPrice>) {
		const basketItem = await this.db.model('basketItem').findOne({
			where: {
				basket_id: basketId,
				item_id: itemId
			}
		}) as unknown as IBasketItemModel;

		if (!basketItem) {
			return;
		}

		await this.db.model('itemPrice').update(price, {
			where: {
				item_price_id: basketItem.item_price_id
			}
		});

		await this.reCalcOrderTotal();
	}

	async bulkSetQty(basketId: number, qty: IQtyUpdate[]) {
		for (const row of qty) {
			const basketItem = await this.db.model('basketItem').findOne({
				where: {
					basket_id: basketId,
					item_id: row.itemId
				}
			}) as unknown as IBasketItemModel;

			if (!basketItem) {
				continue;
			}

			await basketItem.set({
				qty: row.qty
			}).save();
		}

		await this.reCalcOrderTotal();
	}

	setTrx(trx: Transaction|null) {
		this.trx = trx;
		return this;
	}

	setOrder(order: IOrdersModel|null) {
		this.order = order;
		return this;
	}

	protected async reCalcOrderTotal() {
		if (this.order?.basket_id && this.order.publishing_status !== TPublishingStatus.draft) {
			await (this.db.model('orders') as IOrdersModelStatic).calcOrderTotalById(this.instanceRegistry, this.order.order_id);
		}
	}

	protected getBasicFindItemsQuery(basketId: number, langId: number) {
		return squel.select()
			.field('basket_item.basket_item_id')
			.field('basket_item.qty')
			.field('item_price.*')
			.field('basket_item.created_at')
			.field('vw.*')

			.from('basket_item')
			.join('item_price', null, 'basket_item.item_price_id = item_price.item_price_id')
			.join('vw_inventory_item', 'vw', 'vw.item_id = basket_item.item_id')

			.where('basket_item.basket_id = ?', basketId)
			.where('basket_item.deleted_at is null')
			.where('vw.lang_id = ? or vw.lang_id is null', langId)
			.order('basket_item.basket_item_id asc', null)
		;
	}
}