import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import errors from '../../../modules/errors/errors';
import {IOrdersModel} from './orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderServiceDelivery extends ExtendedModel {
		static async fetchShippingByOrderId(orderId: number, langId: number): Promise<IFetchedShipping|null> {
			const order = await this.sequelize.model('orders').findOne({
				where: {
					order_id: orderId
				},
				include: [
					{
						model: this.sequelize.model('orderService'),
						where: {
							is_delivery: true
						},
						required: false,
						include: [
							{
								model: this.sequelize.model('itemPrice'),
							},
							{
								model: this.sequelize.model('orderServiceDelivery'),
								include: [
									{
										model: this.sequelize.model('delivery'),
										include: [
											{
												model: this.sequelize.model('deliveryText'),
												where: {
													lang_id: langId
												}
											}
										]
									}
								]
							}
						]
					}
				]
			}) as unknown as IOrdersModel;

			if (!order) {
				throw new errors.HttpError(404, `Cannot find model '${this.name}'.`);
			}

			let shipping: IFetchedShipping|null = null;

			if (Array.isArray(order.orderServices) && order.orderServices[0]) {
				const orderService = order.orderServices[0];
				const orderServiceDelivery = orderService.orderServiceDelivery;

				let title = orderServiceDelivery.title,
					price = null;

				if (orderServiceDelivery.delivery_id) {
					//@ts-ignore
					title = orderServiceDelivery.delivery.deliveryTexts[0].title;
				}

				//@ts-ignore
				if (orderService.itemPrice) {
					//@ts-ignore
					price = orderService.itemPrice.final_price;
				}

				shipping = {
					order_service_id: orderServiceDelivery.order_service_id,
					delivery_id: orderServiceDelivery.delivery_id,
					title,
					price,
					text_info: orderServiceDelivery.text_info,
					data: orderServiceDelivery.data
				};
			}

			return shipping;
		}
	}

	OrderServiceDelivery.init({
		order_service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		delivery_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		title: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		text_info: {
			type: DataTypes.STRING(1000),
			allowNull: true
		},

		data: {
			type: DataTypes.JSON
		}
	}, {
		tableName: 'order_service_delivery',
		modelName: 'orderServiceDelivery',
		sequelize
	});

	return OrderServiceDelivery;
}

export interface IOrderServiceDeliveryModel extends ExtendedModel {
	order_service_id: number;
	delivery_id: number|null;
	title: string|null;
	text_info: string|null;
	data: {[key: string]: any}|null;
}

export interface IFetchedShipping {
	order_service_id: number;
	delivery_id: number|null;
	title: string|null;
	price: number|null;
	text_info: string|null;
	data: {[key: string]: any}|null;
}

export type IOrderServiceDeliveryModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderServiceDeliveryModel;

	fetchShippingByOrderId: (orderId: number, langId: number) => Promise<IFetchedShipping|null>;
}