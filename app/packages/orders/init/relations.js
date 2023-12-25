export default function (db) {
	const BasketItem = db.model('basketItem');
	const ItemPrice = db.model('itemPrice');

	BasketItem.belongsTo(ItemPrice, {
		targetKey: 'item_price_id',
		foreignKey: 'item_price_id'
	});

	const Delivery = db.model('delivery');
	const DeliveryText = db.model('deliveryText');
	Delivery.hasMany(DeliveryText, {
		foreignKey: 'delivery_id'
	});

	const Orders = db.model('orders');
	const OrderService = db.model('orderService');
	const OrderServiceDelivery = db.model('orderServiceDelivery');
	OrderService.belongsTo(ItemPrice, {
		foreignKey: 'item_price_id'
	});
	OrderService.belongsTo(Orders, {
		foreignKey: 'order_id'
	});
	OrderService.hasOne(OrderServiceDelivery, {
		foreignKey: 'order_service_id'
	});
	OrderServiceDelivery.belongsTo(Delivery, {
		foreignKey: 'delivery_id'
	});

	const Service = db.model('service');
	const ServiceText = db.model('serviceText');
	Service.hasMany(ServiceText, {
		foreignKey: 'service_id'
	});


	const OrderProp = db.model('orderProp');
	Orders.hasOne(OrderProp, {
		foreignKey: 'order_id'
	});
	Orders.hasMany(OrderService, {
		foreignKey: 'order_id'
	});

	const Reserve = db.model('reserve');
	Orders.hasOne(Reserve, {
		foreignKey: 'order_id'
	});

	const Basket = db.model('basket');
	Orders.belongsTo(Basket, {
		foreignKey: 'basket_id'
	});

	const Box = db.model('box');
	const BoxText = db.model('boxText');
	Box.hasMany(BoxText, {
		foreignKey: 'box_id'
	});

	const CouponCampaign = db.model('couponCampaign');
	const CouponCode = db.model('couponCode');
	CouponCampaign.hasMany(CouponCode, {
		foreignKey: 'campaign_id'
	});

	const OrderDiscount = db.model('orderDiscount');
	OrderDiscount.belongsTo(CouponCode, {
		foreignKey: 'code_id'
	});

	const OrderStatus = db.model('orderStatus');
	const OrderStatusText = db.model('orderStatusText');
	Orders.belongsTo(OrderStatus, {
		foreignKey: 'status_id'
	});
	OrderStatus.hasMany(OrderStatusText, {
		foreignKey: 'status_id'
	});
}
