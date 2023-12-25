import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';
import {IReserveItem} from '../../../@types/reserve';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class ReserveItem extends ExtendedModel {
	}

	ReserveItem.init({
		reserve_item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		reserve_id: {
			type: DataTypes.INTEGER
		},

		stock_id: {
			type: DataTypes.INTEGER
		},

		item_id: {
			type: DataTypes.INTEGER
		},

		qty: {
			type: DataTypes.INTEGER
		},

		item_price_id: {
			type: DataTypes.INTEGER
		},

		completed_at: {
			type: DataTypes.DATE
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'reserve_item',
		modelName: 'reserveItem',
		sequelize
	});

	return ReserveItem;
}

export interface IReserveItemModel extends ExtendedModel, IReserveItem {
}

export type IReserveModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IReserveItemModel;
}