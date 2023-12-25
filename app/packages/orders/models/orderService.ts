import ExtendedModel from '../../../modules/db/model';
import moolah from 'moolah';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IOrderServiceDeliveryModel} from './orderServiceDelivery';
import {BuildOptions} from 'sequelize';
import {IItemPriceModel} from './itemPrice';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderService extends ExtendedModel {
		static loadServices(orderId, langId) {
			const total = {
				qty: '0',
				price: '0'
			};

			return this.sequelize.sql('\
select \
order_service.*, \
service_text.title as title, \
order_service_delivery.sub_type as delivery_sub_type, \
order_service_delivery.data as delivery_data, \
delivery.delivery_id, \
delivery.tax as delivery_tax, \
shipping.shipping_id, \
shipping.alias as delivery_alias, \
delivery_text.title as delivery_title, \
shipping_pickup.point_id, \
shipping_pickup.local_id as point_local_id, \
shipping_pickup_text.title as point_title, \
shipping_pickup_text.address as point_address, \
shipping_pickup_text.phone as point_phone, \
shipping_pickup_text.work_schedule as point_work_schedule, \
item_price.final_price \
from \
order_service \
inner join service on \
order_service.service_id = service.service_id \
inner join service_text on \
service_text.service_id = service.service_id \
and service_text.lang_id = :lang \
inner join order_service_delivery on \
order_service_delivery.order_service_id = order_service.order_service_id \
inner join item_price on \
item_price.item_price_id = order_service.item_price_id \
left join delivery on \
delivery.delivery_id = order_service_delivery.delivery_id \
left join delivery_text on \
delivery.delivery_id = delivery_text.delivery_id \
and delivery_text.lang_id = :lang \
left join shipping on \
delivery.shipping_id = shipping.shipping_id \
left join shipping_pickup on \
shipping_pickup.point_id = order_service_delivery.point_id \
left join shipping_pickup_text on \
shipping_pickup_text.point_id = shipping_pickup.point_id \
and shipping_pickup_text.lang_id = :lang \
where \
order_service.order_id = :order\
', {
				order: orderId,
				lang: langId
			})
				.then(rows => {
					for (let i = 0; i < rows.length; i++) {
						//@ts-ignore
						const {qty, total_price} = rows[i];
						total.qty = moolah(total.qty).plus(qty).string();
						total.price = moolah(total.price).plus(total_price).string();
					}

					return {
						items: rows,
						total
					};
				});
		}
	}

	OrderService.init({
		order_service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		order_id: {
			type: DataTypes.INTEGER
		},

		service_id: {
			type: DataTypes.INTEGER
		},

		qty: {
			type: DataTypes.INTEGER
		},

		total_price: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		item_price_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		is_delivery: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'order_service',
		modelName: 'orderService',
		sequelize
	});

	return OrderService;
}

export interface IOrderServiceModel extends ExtendedModel {
	order_service_id: number;
	order_id: number;
	service_id: number;
	qty: number;
	total_price: number;
	item_price_id: number;
	is_delivery: boolean;
	created_at: string;

	readonly orderServiceDelivery?: IOrderServiceDeliveryModel;
	readonly itemPrice?: IItemPriceModel;
}

export type IOrderServiceModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderServiceModel
}