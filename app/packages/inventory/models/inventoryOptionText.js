import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class InventoryOptionText extends ExtendedModel {
	}

	InventoryOptionText.init({
		option_id: {
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
		tableName: 'inventory_option_text',
		modelName: 'inventoryOptionText',
		sequelize
	});

	return InventoryOptionText;
}