// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ExtendedSequelize from '../../db/sequelize'; //eslint-disable-line no-unused-vars

/**
 * @param {ExtendedSequelize} db
 */
export default function (db) {
	const Tariff = db.model('tariff');
	const Instance = db.model('instance');
	const Host = db.model('host');
	const Currency = db.model('currency');
	const Invoice = db.model('invoice');
	const WixApp = db.model('wixApp');

	Instance.belongsTo(Tariff, {
		foreignKey: 'tariff_id'
	});

	Instance.hasOne(WixApp, {
		foreignKey: 'instance_id'
	});

	Instance.hasMany(Host, {
		foreignKey: 'instance_id'
	});

	Host.belongsTo(Instance, {
		foreignKey: 'instance_id'
	});

	const PaymentTransaction = db.model('paymentTransaction');
	PaymentTransaction.belongsTo(Instance, {
		foreignKey: 'instance_id'
	});
	PaymentTransaction.belongsTo(Currency, {
		foreignKey: 'currency_id'
	});
	PaymentTransaction.belongsTo(Invoice, {
		foreignKey: 'invoice_id'
	});
}