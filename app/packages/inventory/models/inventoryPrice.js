import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class InventoryPrice extends ExtendedModel {
	}

	InventoryPrice.init({
		item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		value: {
			type: DataTypes.DECIMAL(20, 2)
		},

		old: {
			type: DataTypes.DECIMAL(20, 2)
		},

		currency_id: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'inventory_price',
		modelName: 'inventoryPrice',
		sequelize
	});

	return InventoryPrice;
}