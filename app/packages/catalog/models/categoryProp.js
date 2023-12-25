import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CategoryProp extends ExtendedModel {
	}

	CategoryProp.init({
		category_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		use_filter: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},

		filter_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		custom_link: {
			type: DataTypes.STRING(500),
			allowNull: true
		},

		sub_category_policy: {
			type: DataTypes.ENUM('subGoods', 'subCategories', 'subCategoriesNoLeftMenu'),
			allowNull: true
		},

		show_in_parent_page_menu: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		}
	}, {
		tableName: 'category_prop',
		modelName: 'categoryProp',
		sequelize
	});

	return CategoryProp;
}