import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';
import {ICountryText} from '../../../@types/delivery';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class CountryText extends ExtendedModel {
	}

	CountryText.init({
		country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'country_text',
		modelName: 'countryText',
		sequelize
	});

	return CountryText;
}

export interface ICountryTextModel extends ExtendedModel, ICountryText {
}

export type ICountryTextModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICountryTextModel;
}