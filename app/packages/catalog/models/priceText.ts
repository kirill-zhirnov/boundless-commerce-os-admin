import ExtendedModel from '../../../modules/db/model';
import {BuildOptions} from 'sequelize';
import {IPriceText} from '../../../@types/catalog';

export default function (sequelize, DataTypes) {
	class PriceText extends ExtendedModel {
	}

	PriceText.init({
		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'price_text',
		modelName: 'priceText',
		sequelize
	});

	return PriceText;
}

export interface IPriceTextModel extends ExtendedModel, IPriceText {}

export type IPriceTextModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPriceTextModel;
}