import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IOrderDiscount} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderDiscount extends ExtendedModel {
	}

	OrderDiscount.init({
		discount_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		order_id: {
			type: DataTypes.INTEGER
		},

		title: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		discount_type: {
			type: DataTypes.ENUM('fixed', 'percent'),
			allowNull: true
		},

		value: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		source: {
			type: DataTypes.ENUM('manual', 'coupon'),
			allowNull: true
		},

		code_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'order_discount',
		modelName: 'orderDiscount',
		sequelize
	});

	return OrderDiscount;
}

export interface IOrderDiscountModel extends ExtendedModel, IOrderDiscount {
}

export type IOrderDiscountModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderDiscountModel;
}