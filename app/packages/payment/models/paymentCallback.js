import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PaymentCallback extends ExtendedModel {
	}

	PaymentCallback.init({
		payment_callback_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		payment_transaction_id: {
			type: DataTypes.INTEGER
		},

		response: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'payment_callback',
		modelName: 'paymentCallback',
		sequelize
	});

	return PaymentCallback;
}