import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {IVwCountry} from '../../../@types/delivery';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class VwCountry extends ExtendedModel {
	}

	VwCountry.init({
		country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		code: {
			type: DataTypes.CHAR(2),
			allowNull: true
		},
		lang_id: {
			type: DataTypes.INTEGER
		},
		title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'vw_country',
		modelName: 'vwCountry',
		sequelize
	});
}

export interface IVwCountryModel extends ExtendedModel, IVwCountry {
}

export type IVwCountryModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IVwCountryModel;
}