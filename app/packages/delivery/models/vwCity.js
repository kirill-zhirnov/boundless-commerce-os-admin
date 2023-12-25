import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class VwCity extends ExtendedModel {
	}

	VwCity.init({
		city_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		country_id: {
			type: DataTypes.INTEGER
		},

		region_id: {
			type: DataTypes.INTEGER
		},

		area_id: {
			type: DataTypes.INTEGER
		},

		is_important: {
			type: DataTypes.BOOLEAN
		},

		country_code: {
			type: DataTypes.CHAR(2)
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		city_title: {
			type: DataTypes.TEXT
		},

		country_title: {
			type: DataTypes.TEXT
		},

		region_title: {
			type: DataTypes.TEXT
		},

		area_title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'vw_city',
		modelName: 'vwCity',
		sequelize
	});

	return VwCity;
}