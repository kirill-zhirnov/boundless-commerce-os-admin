import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPaymentMethodText} from '../../../@types/payment';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PaymentMethodText extends ExtendedModel {
	}

	PaymentMethodText.init({
		payment_method_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'payment_method_text',
		modelName: 'paymentMethodText',
		sequelize
	});

	return PaymentMethodText;
}

export interface IPaymentMethodTextModel extends ExtendedModel, IPaymentMethodText {
}

export type IPaymentGatewayModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPaymentMethodTextModel;
}