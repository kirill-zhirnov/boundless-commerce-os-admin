import ExtendedModel from '../../../modules/db/model';

// characteristic_variant_val_text - is not used anymore and might be removed.

export default function (sequelize, DataTypes) {
	class CharacteristicVariantValText extends ExtendedModel {
	}

	CharacteristicVariantValText.init({
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
		tableName: 'characteristic_variant_val_text',
		modelName: 'characteristicVariantValText',
		sequelize
	});

	return CharacteristicVariantValText;
}