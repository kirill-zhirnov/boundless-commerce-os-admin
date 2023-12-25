import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IOrdersModel} from '../models/orders';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';
import OrderItemsReserveProvider from './orderItems/reserveProvider';
import OrderItemsBasketProvider from './orderItems/basketProvider';
import errors from '../../../modules/errors/errors';
import {TOrdersItem} from '../../../@types/orders';
import moolah from 'moolah';

export default class OrderItems {
	protected db: ExtendedSequelize;
	protected order?: IOrdersModel;
	protected reserveProvider?: OrderItemsReserveProvider;
	protected basketProvider?: OrderItemsBasketProvider;

	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected clientRegistry: IServerClientRegistry,
		protected orderId: number,
	) {
		this.db = this.instanceRegistry.getDb();
	}

	async addItem(itemId: number, qty: number, price: IOrderItemsPrice) {
		const order = await this.getOrder(true);

		if (!price.final_price) {
			price.final_price = price.basic_price;
		}

		if (price.basic_price != price.final_price && !price.discount_percent && !price.discount_amount) {
			price.discount_amount = moolah(price.basic_price).less(price.final_price).string();
		}

		if (order.reserve) {
			await this.getReserveProvider(order).addItem(itemId, qty, price);
		} else {
			const basketId = await this.getBasketId(order, true);
			await this.getBasketProvider(order).addItem(basketId, itemId, qty, price);
		}
	}

	async getItems(criteria: IItemsCriteria|null = null): Promise<TOrdersItem[]> {
		const order = await this.getOrder();

		if (order.reserve) {
			return this.getReserveProvider(order).getItems(criteria);
		} else {
			const basketId = await this.getBasketId(order);
			return this.getBasketProvider().getItems(basketId, this.clientRegistry.getEditingLang().lang_id, criteria);
		}
	}

	async rmItems(itemIds: number[]) {
		const order = await this.getOrder(true);

		if (order.reserve) {
			return this.getReserveProvider(order).rmItems(itemIds);
		} else {
			const basketId = await this.getBasketId(order);
			return this.getBasketProvider(order).rmItems(basketId, itemIds);
		}
	}

	async updatePrice(itemId: number, price: Partial<IOrderItemsPrice>, stockId: number|null = null) {
		const order = await this.getOrder(true);

		if (price.basic_price && !price.final_price) {
			price.final_price = price.basic_price;
		}

		if (order.reserve) {
			await this.getReserveProvider(order).updatePrice(itemId, price, stockId);
		} else {
			const basketId = await this.getBasketId(order);
			await this.getBasketProvider(order).updatePrice(basketId, itemId, price);
		}
	}

	async bulkSetQty(qty: IQtyUpdate[]) {
		const order = await this.getOrder(true);

		if (order.reserve) {
			await this.getReserveProvider(order).bulkSetQty(qty);
		} else {
			const basketId = await this.getBasketId(order);
			await this.getBasketProvider(order).bulkSetQty(basketId, qty);
		}
	}

	protected async getBasketId(order: IOrdersModel, makeUserIfGuest = false): Promise<number> {
		if (order.basket_id) {
			return order.basket_id;
		}

		const user = this.clientRegistry.getUser();
		if (makeUserIfGuest && user && !user.getId()) {
			await user.makeGuestVisitor();
		}

		const basketRow = await this.clientRegistry.getBasket().getBasket();
		return basketRow.basket_id;
	}

	protected getBasketProvider(order: IOrdersModel|null = null): OrderItemsBasketProvider {
		if (!this.basketProvider) {
			this.basketProvider = new OrderItemsBasketProvider(this.instanceRegistry);
			this.basketProvider.setOrder(order);
		}

		return this.basketProvider;
	}

	protected getReserveProvider(order: IOrdersModel) {
		if (!this.reserveProvider) {
			this.reserveProvider = new OrderItemsReserveProvider(this.instanceRegistry, order);
			this.reserveProvider.setClientRegistry(this.clientRegistry);
		}

		return this.reserveProvider;
	}

	protected async getOrder(throwIfLocked: boolean = false): Promise<IOrdersModel> {
		if (!this.order) {
			this.order = await this.db.model('orders').findOne({
				include: [
					{model: this.db.model('reserve')}
				],
				where: {
					order_id: this.orderId
				}
			}) as unknown as IOrdersModel;

			if (!this.order) {
				throw new errors.HttpError(404, `Cannot find order by ID: ${this.orderId}`);
			}
		}

		if (throwIfLocked && this.order.isLocked()) {
			throw new Error('Order is locked - cant make changes.');
		}

		return this.order;
	}
}

export interface IItemsCriteria {
	item_id?: number|number[];
	product_id?: number;
	variant_id?: number;
	custom_item_id?: number;
}

export interface IQtyUpdate {
	itemId: number;
	qty: number;
	locationId?: number|null;
}

export interface IOrderItemsPrice {
	price_id?: number|null;
	basic_price: number|string;
	final_price?: number|string|null;
	discount_amount?: number|string|null;
	discount_percent?: number|string|null;
}