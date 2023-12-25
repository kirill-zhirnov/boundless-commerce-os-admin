import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PageProps extends ExtendedModel {
	}

	PageProps.init({
		page_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

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
		}
	}, {
		tableName: 'page_props',
		modelName: 'pageProps',
		sequelize
	});

	return PageProps;
}