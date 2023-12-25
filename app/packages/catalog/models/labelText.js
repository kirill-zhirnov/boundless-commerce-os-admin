import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class LabelText extends ExtendedModel {
	}

	LabelText.init({
		label_id: {
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
		tableName: 'label_text',
		modelName: 'labelText',
		sequelize
	});

	return LabelText;
}