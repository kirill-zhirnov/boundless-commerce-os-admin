import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ProductImportRel extends ExtendedModel {
	}

	ProductImportRel.init({
		log_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		category_id: {
			type: DataTypes.INTEGER
		},

		variant_id: {
			type: DataTypes.INTEGER
		},

		status: {
			type: DataTypes.ENUM('created', 'updated', 'error', 'appendVariant', 'updateVariant')
		},

		message: {
			type: DataTypes.JSON
		}
	}, {
		tableName: 'product_import_rel',
		modelName: 'productImportRel',
		sequelize
	});

	return ProductImportRel;
}