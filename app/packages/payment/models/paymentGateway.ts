import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPaymentGateway} from '../../../@types/payment';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PaymentGateway extends ExtendedModel {
		static getRouteFormByAlias(alias) {
			switch (alias) {
				case 'paypal':
					return 'payment/admin/paymentMethod/paypal';

				default:
					return 'payment/admin/paymentMethod/form';
			}
		}
	}

	PaymentGateway.init({
		payment_gateway_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(20)
		},

		settings: {
			type: DataTypes.JSONB
		},

		sort: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'payment_gateway',
		modelName: 'paymentGateway',
		sequelize
	});

	return PaymentGateway;
}

export interface IPaymentGatewayModel extends ExtendedModel, IPaymentGateway {
}

export type IPaymentGatewayModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPaymentGatewayModel;

	getRouteFormByAlias: (alias: string) => string
}