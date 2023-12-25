export default function(db) {
	const Orders = db.model('orders');
	const PaymentMethod = db.model('paymentMethod');
	const PaymentMethodText = db.model('paymentMethodText');
	PaymentMethod.hasMany(PaymentMethodText, {
		foreignKey: 'payment_method_id'
	});

	Orders.belongsTo(PaymentMethod, {
		foreignKey: 'payment_method_id'
	});

	const PaymentGateway = db.model('paymentGateway');
	return PaymentMethod.belongsTo(PaymentGateway, {
		foreignKey : 'payment_gateway_id'
	});
}