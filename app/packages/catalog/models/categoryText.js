import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CategoryText extends ExtendedModel {
	}

	CategoryText.init({
		category_id: {
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

		description_top: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		description_bottom: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		//		typearea_id :
		//			type : DataTypes.INTEGER
		//			primaryKey : true

		custom_title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		custom_header: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		meta_description: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		meta_keywords: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		url_key: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'category_text',
		modelName: 'categoryText',
		sequelize
	});

	return CategoryText;
}