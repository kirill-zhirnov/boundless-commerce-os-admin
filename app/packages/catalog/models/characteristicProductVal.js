import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class СharacteristicProductVal extends ExtendedModel {
	}

	СharacteristicProductVal.init({
		value_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		characteristic_id: {
			type: DataTypes.INTEGER
		},

		case_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'characteristic_product_val',
		modelName: 'characteristicProductVal',
		sequelize
	});

	return СharacteristicProductVal;
}