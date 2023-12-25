import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PaymentTransaction extends ExtendedModel {
	}

	PaymentTransaction.init({
		payment_transaction_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		payment_method_id: {
			type: DataTypes.INTEGER
		},

		status: {
			type: DataTypes.TEXT
		},

		mark_up_amount: {
			type: DataTypes.DECIMAL(20, 2)
		},

		total_amount: {
			type: DataTypes.DECIMAL(20, 2)
		},

		currency_id: {
			type: DataTypes.INTEGER
		},

		external_id: {
			type: DataTypes.TEXT
		},

		order_id: {
			type: DataTypes.INTEGER
		},

		person_id: {
			type: DataTypes.INTEGER
		},

		data: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		error: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'payment_transaction',
		modelName: 'paymentTransaction',
		sequelize
	});

	return PaymentTransaction;
}