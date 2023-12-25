import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CharacteristicTypeCase extends ExtendedModel {
	}

	CharacteristicTypeCase.init({
		case_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		characteristic_id: {
			type: DataTypes.INTEGER
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'characteristic_type_case',
		modelName: 'characteristicTypeCase',
		sequelize
	});

	return CharacteristicTypeCase;
}