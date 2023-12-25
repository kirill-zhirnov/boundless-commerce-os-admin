import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {IOrderStatusText} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderStatusText extends ExtendedModel {
	}

	OrderStatusText.init({
		status_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'order_status_text',
		modelName: 'orderStatusText',
		sequelize
	});

	return OrderStatusText;
}

export interface IOrderStatusTextModel extends ExtendedModel, IOrderStatusText {
}

export type IOrderStatusTextModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderStatusTextModel;
}