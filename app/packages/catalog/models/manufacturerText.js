import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ManufacturerText extends ExtendedModel {
	}

	ManufacturerText.init({
		manufacturer_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.STRING,
			allowNull: true
		},


		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		// typearea_id: {
		// 	type: DataTypes.INTEGER,
		// 	allowNull: true
		// },

		custom_title: {
			type: DataTypes.STRING,
			allowNull: true
		},

		custom_header: {
			type: DataTypes.STRING,
			allowNull: true
		},

		meta_description: {
			type: DataTypes.STRING,
			allowNull: true
		},

		meta_keywords: {
			type: DataTypes.STRING,
			allowNull: true
		},

		url_key: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'manufacturer_text',
		modelName: 'manufacturerText',
		sequelize
	});

	return ManufacturerText;
}