import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CharacteristicText extends ExtendedModel {
	}

	CharacteristicText.init({
		characteristic_id: {
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
		},

		help: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'characteristic_text',
		modelName: 'characteristicText',
		sequelize
	});

	return CharacteristicText;
}