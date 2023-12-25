import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {IOrderAttrs} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderAttrs extends ExtendedModel {
	}

	OrderAttrs.init({
		attr_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255),
		},

		key: {
			type: DataTypes.STRING(20),
		},

		type: {
			type: DataTypes.ENUM('text', 'text_area', 'checkbox', 'dropdown')
		},

		options: {
			type: DataTypes.JSON,
			allowNull: true
		},

		hint: {
			type: DataTypes.STRING(1000),
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
		}
	}, {
		tableName: 'order_attrs',
		modelName: 'orderAttrs',
		sequelize
	});
}

export interface IOrderAttrsModel extends ExtendedModel, IOrderAttrs {
}

export type IOrderAttrsModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderAttrsModel;
}