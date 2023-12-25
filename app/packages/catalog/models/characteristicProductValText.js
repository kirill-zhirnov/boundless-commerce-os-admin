import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CharacteristicProductValText extends ExtendedModel {
	}

	CharacteristicProductValText.init({
		value_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		value: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'characteristic_product_val_text',
		modelName: 'characteristicProductValText',
		sequelize
	});

	return CharacteristicProductValText;
}