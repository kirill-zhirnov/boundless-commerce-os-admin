import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class ItemPrice extends ExtendedModel {
	}

	ItemPrice.init({
		item_price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		price_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		basic_price: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		final_price: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		discount_amount: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		discount_percent: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true
		}
	}, {
		tableName: 'item_price',
		modelName: 'itemPrice',
		sequelize
	});

	return ItemPrice;
}

export interface IItemPriceModel extends ExtendedModel {
	item_price_id: number;
	price_id: number|null;
	basic_price: number|null;
	final_price: number|null;
	discount_amount: number|null;
	discount_percent: number|null;
}

export type IItemPriceModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IItemPriceModel
}