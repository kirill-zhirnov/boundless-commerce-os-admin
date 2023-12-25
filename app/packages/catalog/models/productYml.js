import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ProductYml extends ExtendedModel {
	}

	ProductYml.init({
		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		yml_export: {
			type: DataTypes.BOOLEAN
		},

		vendor_code: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		model: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		sales_notes: {
			type: DataTypes.STRING(50),
			allowNull: true
		},

		manufacturer_warranty: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},

		seller_warranty: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},

		adult: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},

		age: {
			type: DataTypes.STRING(3),
			allowNull: true
		},

		cpa: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		}
	}, {
		tableName: 'product_yml',
		modelName: 'productYml',
		sequelize
	});

	return ProductYml;
}