import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ProductImportImgs extends ExtendedModel {
	}

	ProductImportImgs.init({
		import_img_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		import_id: {
			type: DataTypes.INTEGER
		},

		url: {
			type: DataTypes.TEXT
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		status: {
			type: DataTypes.ENUM('new', 'downloaded', 'error')
		},

		reason: {
			type: DataTypes.STRING(500),
			allowNull: true
		}
	}, {
		tableName: 'product_import_imgs',
		modelName: 'productImportImgs',
		sequelize
	});

	return ProductImportImgs;
}