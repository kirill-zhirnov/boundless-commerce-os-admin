import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ServiceText extends ExtendedModel {
	}

	ServiceText.init({
		service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'service_text',
		modelName: 'serviceText',
		sequelize
	});

	return ServiceText;
}