import ExtendedModel from '../../db/model';
import {IPaymentTransaction} from '../../../@types/instances';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class PaymentTransaction extends ExtendedModel {
	}

	PaymentTransaction.init({
		payment_transaction_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		instance_id: {
			type: DataTypes.INTEGER
		},

		invoice_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		payment_method_id: {
			type: DataTypes.INTEGER
		},

		status: {
			type: DataTypes.TEXT
		},

		amount: {
			type: DataTypes.DECIMAL(20, 2)
		},

		currency_id: {
			type: DataTypes.INTEGER
		},

		external_id: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		person_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		data: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		error: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		refund_amount: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		refunded_at: {
			type: DataTypes.DATE,
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

export interface IPaymentTransactionModel extends ExtendedModel, IPaymentTransaction {}
export type IPaymentTransactionModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPaymentTransactionModel;
}