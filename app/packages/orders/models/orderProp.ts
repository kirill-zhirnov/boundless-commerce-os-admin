import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IOrderProp} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderProp extends ExtendedModel {
	}

	OrderProp.init({
		order_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		client_comment: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		custom_attrs: {
			type: DataTypes.JSONB,
			allowNull: true
		}
	}, {
		tableName: 'order_prop',
		modelName: 'orderProp',
		sequelize
	});

	return OrderProp;
}

export interface IOrderPropModel extends ExtendedModel, IOrderProp {
}

export type IOrderPropModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderPropModel;
}