import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class VwRegion extends ExtendedModel {
	}

	VwRegion.init({
		region_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		country_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		region_title: {
			type: DataTypes.TEXT
		},

		country_title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'vw_region',
		modelName: 'vwRegion',
		sequelize
	});

	return VwRegion;
}