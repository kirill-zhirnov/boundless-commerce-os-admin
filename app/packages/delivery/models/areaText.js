import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class AreaText extends ExtendedModel {
	}

	AreaText.init({
		area_id: {
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
		tableName: 'area_text',
		modelName: 'areaText',
		sequelize
	});

	return AreaText;
}