import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IOrderHistory} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderHistory extends ExtendedModel {
	}

	OrderHistory.init({
		history_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		order_id: {
			type: DataTypes.INTEGER,
		},
		status_id: {
			type: DataTypes.INTEGER,
		},
		person_id: {
			type: DataTypes.INTEGER,
		},
		changed_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'order_history',
		modelName: 'orderHistory',
		sequelize
	});

	return OrderHistory;
}

export interface IOrderHistoryModel extends ExtendedModel, IOrderHistory {
}

export type IOrderHistoryModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderHistoryModel;
}