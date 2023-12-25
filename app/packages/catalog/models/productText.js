import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ProductText extends ExtendedModel {
		static setDescription(productId, langId, text) {
			return Q(this.sequelize.model('productText').update({
				description: text
			}, {
				where: {
					product_id: productId,
					lang_id: langId
				}
			}));
		}

	}

	ProductText.init({
		product_id: {
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

		//		typearea_id :
		//			type : DataTypes.INTEGER

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
		tableName: 'product_text',
		modelName: 'productText',
		sequelize
	});

	return ProductText;
}