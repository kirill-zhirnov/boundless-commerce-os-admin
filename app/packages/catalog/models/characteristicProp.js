import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CharacteristicProp extends ExtendedModel {
	}

	CharacteristicProp.init({
		characteristic_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		is_folder: {
			type: DataTypes.BOOLEAN
		},

		is_hidden: {
			type: DataTypes.BOOLEAN
		},

		default_value: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'characteristic_prop',
		modelName: 'characteristicProp',
		sequelize
	});

	return CharacteristicProp;
}