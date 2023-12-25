import ExtendedModel from '../../../modules/db/model';

// table needs to save relation between variants and characteristics.
// if rel_type = redefine - variant characteristic redefines product value
// rel_type.redefine - is not used anymore.
// tables is used only for storing relation between variant and characteristics

export default function (sequelize, DataTypes) {
	class CharacteristicVariantVal extends ExtendedModel {
	}

	CharacteristicVariantVal.init({
		value_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		variant_id: {
			type: DataTypes.INTEGER
		},

		characteristic_id: {
			type: DataTypes.INTEGER
		},

		case_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		//rel_type=redefine is not used anymore
		rel_type: {
			type: DataTypes.ENUM('variant', 'redefine')
		}
	}, {
		tableName: 'characteristic_variant_val',
		modelName: 'characteristicVariantVal',
		sequelize
	});

	return CharacteristicVariantVal;
}