import ExtendedModel from '../../db/model';
import {BuildOptions} from 'sequelize';
import {IPaymentMethod} from '../../../@types/instances';

export default function (sequelize, DataTypes) {
	class PaymentMethod extends ExtendedModel {
	}

	PaymentMethod.init({
		payment_method_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(20)
		}
	}, {
		tableName: 'payment_method',
		modelName: 'paymentMethod',
		sequelize
	});

	return PaymentMethod;
}

export interface IPaymentMethodModel extends ExtendedModel, IPaymentMethod {}

export type IPaymentMethodStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPaymentMethodModel;
}