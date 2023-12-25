import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class MenuItemRel extends ExtendedModel {
	}

	MenuItemRel.init({
		item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		category_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		page_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		product_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'menu_item_rel',
		modelName: 'menuItemRel',
		sequelize
	});

	return MenuItemRel;
}