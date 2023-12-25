import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PaymentRequest extends ExtendedModel {
	}

	PaymentRequest.init({
		payment_request_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		payment_transaction_id: {
			type: DataTypes.INTEGER
		},

		request: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'payment_request',
		modelName: 'paymentRequest',
		sequelize
	});

	return PaymentRequest;
}