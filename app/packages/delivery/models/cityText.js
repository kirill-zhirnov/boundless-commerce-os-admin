import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CityText extends ExtendedModel {
	}

	CityText.init({
		city_id: {
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
		tableName: 'city_text',
		modelName: 'cityText',
		sequelize
	});

	return CityText;
}