import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class CustomItem extends ExtendedModel {
	}

	CustomItem.init({
		custom_item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255)
		},

		price: {
			type: DataTypes.DECIMAL(20, 2)
		}
	}, {
		tableName: 'custom_item',
		modelName: 'customItem',
		sequelize
	});

	return CustomItem;
}

export interface ICustomItemModel extends ExtendedModel {
	custom_item_id: number;
	title: string;
	price: number;
}

export type ICustomItemStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICustomItemModel;
}