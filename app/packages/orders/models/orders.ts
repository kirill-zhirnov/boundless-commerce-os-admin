import ExtendedModel from '../../../modules/db/model';
import moolah from 'moolah';
import TotalCalculator from '../components/totalCalculator';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {TPublishingStatus} from '../../../@types/db';
import {BuildOptions, Transaction} from 'sequelize';
import {IReserveModel} from '../../inventory/models/reserve';
import {IOrderServiceModel} from './orderService';
import {IOrder, IOrderDiscount, TOrdersItem} from '../../../@types/orders';
import {IOrderPropModel} from './orderProp';
import {IPersonModel} from '../../customer/models/person';
import {IOrderStatusModel} from './orderStatus';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import OrderItemsReserveProvider from '../components/orderItems/reserveProvider';
import OrderItemsBasketProvider from '../components/orderItems/basketProvider';
import {TTaxStatus} from '../../../@types/product';
import {ITaxClass} from '../../../@types/system';
import {TAddressType} from '../../../@types/person';
import {IPersonAddressModel} from '../../customer/models/personAddress';
import ServerClientRegistry from '../../../modules/registry/client/server';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Orders extends ExtendedModel {
		public publishing_status: TPublishingStatus;
		readonly reserve?: IReserveModel;

		isDraft(): boolean {
			return this.publishing_status === TPublishingStatus.draft;
		}

		static async calcOrderTotalById(instanceRegistry: IInstanceRegistry, orderId: number, trx: Transaction|null = null): Promise<void> {
			const discounts = await this.sequelize.sql<Pick<IOrderDiscount, 'discount_id' | 'discount_type' | 'value'>>(`
				select
					discount_id, discount_type, value
				from
					order_discount
				where
					order_id = :id
				order by
					discount_id asc
			`, {
				id: orderId
			}, {transaction: trx});

			const [order] = await this.sequelize.sql<{
				order_id: number,
				basket_id?: number,
				reserve_id?: number,
				mark_up?: number,
				services_qty: number,
				services_price: number,
				shipping_qty: number,
				shipping_price?: number,
			}>(`
				select
					order_id,
					orders.basket_id,
					reserve.reserve_id,
					payment_method.mark_up,
					not_delivery_service.qty as services_qty,
					not_delivery_service.price as services_price,
					shipping_service.qty as shipping_qty,
					shipping_service.price as shipping_price
				from
					orders
					left join payment_method using(payment_method_id)
					left join reserve using(order_id)
					left join (
						select
							order_id,
							coalesce(sum(order_service.qty), 0) as qty,
							coalesce(sum(order_service.total_price), 0) as price
						from
							order_service
						where
							order_id = :orderId
							and is_delivery is false
						group by order_id
					) as not_delivery_service using(order_id)
				left join (
					select
						order_id,
						coalesce(sum(order_service.qty), 0) as qty,
						coalesce(sum(order_service.total_price), 0) as price
					from
						order_service
					where
						order_id = :orderId
						and is_delivery is true
					group by order_id
				) as shipping_service using(order_id)
				where
					order_id = :orderId
		`, {orderId}, {transaction: trx});

			if (!order) {
				throw new Error('Can\'t find order');
			}

			const taxSettings = await instanceRegistry.getSettings().get('system', 'tax');

			const totalCalculator = new TotalCalculator();
			totalCalculator.setTaxSettings(taxSettings);

			totalCalculator
				.setShipping(order.shipping_price, order.shipping_qty)
				.setServices(order.services_price, order.services_qty)
			;

			if (order.mark_up) {
				totalCalculator.setPaymentMarkUp(order.mark_up);
			}

			discounts.forEach(({discount_type, value}) => totalCalculator.addDiscount(discount_type, value));

			const orderModel = await this.sequelize.model('orders').findOne({
				where: {order_id: order.order_id},
				include: [{model: this.sequelize.model('reserve')}],
				transaction: trx
			}) as IOrdersModel;

			let items: TOrdersItem[] = [];
			if (order.reserve_id) {
				const reserveProvider = new OrderItemsReserveProvider(instanceRegistry, orderModel);

				const serverClientRegistry = new ServerClientRegistry();
				serverClientRegistry.setLang({lang_id: 1, code: 'en', is_backend: true, titles: {}});
				reserveProvider.setClientRegistry(serverClientRegistry);

				items = await reserveProvider.getItems();
			} else {
				const basketProvider = new OrderItemsBasketProvider(instanceRegistry);
				basketProvider.setTrx(trx).setOrder(orderModel);

				items = await basketProvider.getItems(orderModel.basket_id, 1);
			}

			for (const {type, item_id, final_price, qty, product} of items) {
				let taxStatus: TTaxStatus = TTaxStatus.none;
				let taxClassId: number|null = null;
				if (['variant', 'product'].includes(type)) {
					taxStatus = product.tax_status;
					taxClassId = product.tax_class_id;
				}

				totalCalculator.addItem(item_id, final_price, qty, taxStatus, taxClassId);
			}

			const rows = await this.sequelize.model('taxClass').findAll({
				include: [{model: this.sequelize.model('taxRate')}],
				order: [[this.sequelize.model('taxRate'), 'priority', 'asc']],
				transaction: trx
			});
			const taxClasses = rows.map(row => row.toJSON()) as ITaxClass[];
			totalCalculator.setTaxClasses(taxClasses);

			if (orderModel.customer_id) {
				const addresses = (await this.sequelize.model('personAddress').findAll({
					where: {
						person_id: orderModel.customer_id,
						type: ['billing', 'shipping']
					},
					transaction: trx
				})) as IPersonAddressModel[];

				addresses.forEach((address) => {
					if (address.type === TAddressType.shipping && address.country_id) {
						totalCalculator.setShippingLocation({
							country_id: address.country_id,
							state: address.state,
							zip: address.zip
						});
					} else if (address.type === TAddressType.billing && address.country_id) {
						totalCalculator.setBillingLocation({
							country_id: address.country_id,
							state: address.state,
							zip: address.zip
						});
					}
				});
			}

			const total = totalCalculator.calcTotal();

			await this.update({
				service_total_price: total.servicesSubTotal.price,
				service_total_qty: total.servicesSubTotal.qty,
				total_price: total.price,
				payment_mark_up: total.paymentMarkUp,
				discount_for_order: total.discount,
				tax_amount: total.tax.totalTaxAmount,
				//for debug purpose saving
				tax_calculations: total
			}, {
				where: {
					order_id: orderId
				},
				transaction: trx
			});
		}

		static async createUsersDraft(personId) {
			const [row] = await this.sequelize.sql(`
				insert into orders
					(publishing_status, created_by)
				values
					('draft', :created)
				on conflict (publishing_status, created_by)
					where publishing_status = 'draft' and created_by is not null
				do update set
					publishing_status = excluded.publishing_status
				returning order_id
			`, {
				created: personId
			});

			//@ts-ignore
			return row.order_id;
		}

		isLocked(): boolean {
			if (this.reserve && this.reserve.completed_at) {
				return true;
			}

			return false;
		}
	}

	Orders.init({
		order_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		source_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		status_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		point_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		customer_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		basket_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		payment_method_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		service_total_price: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		service_total_qty: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		payment_mark_up: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		discount_for_order: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		total_price: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		created_by: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		confirmed_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		paid_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		got_cash_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		publishing_status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		public_id: {
			type: DataTypes.UUID,
		},

		tax_amount: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		tax_calculations: {
			type: DataTypes.JSON
		}
	}, {
		tableName: 'orders',
		modelName: 'orders',
		sequelize
	});

	return Orders;
}

export interface IOrdersModel extends ExtendedModel, IOrder {
	readonly reserve?: IReserveModel;
	readonly orderServices?: IOrderServiceModel[];
	readonly orderProp?: IOrderPropModel;
	readonly person?: IPersonModel;
	readonly orderStatus?: IOrderStatusModel;

	isLocked: () => boolean;
	isDraft: () => boolean;
}

export type IOrdersModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrdersModel;

	calcOrderTotalById: (instanceRegistry: IInstanceRegistry, orderId: number, trx?: Transaction) => Promise<void>;
}