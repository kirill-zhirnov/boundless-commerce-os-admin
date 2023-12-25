import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class WarehouseText extends ExtendedModel {
	}

	WarehouseText.init({
		warehouse_id: {
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

		address: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'warehouse_text',
		modelName: 'warehouseText',
		sequelize
	});

	return WarehouseText;
}