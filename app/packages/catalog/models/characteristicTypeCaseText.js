import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CharacteristicTypeCaseText extends ExtendedModel {
	}

	CharacteristicTypeCaseText.init({
		case_id: {
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
		tableName: 'characteristic_type_case_text',
		modelName: 'characteristicTypeCaseText',
		sequelize
	});

	return CharacteristicTypeCaseText;
}