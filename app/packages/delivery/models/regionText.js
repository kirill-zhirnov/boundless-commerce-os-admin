import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class RegionText extends ExtendedModel {
	}

	RegionText.init({
		region_id: {
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
		tableName: 'region_text',
		modelName: 'regionText',
		sequelize
	});

	return RegionText;
}