import ExtendedModel from '../../../modules/db/model';
import * as thumbnailUrl from '../../cms/modules/thumbnail/url';

export default function (sequelize, DataTypes) {
	class ProductReviewImg extends ExtendedModel {
		static makeThumbsByImgRow(instanceRegistry, row) {
			const imgAttrs = {
				path: row.image.path,
				width: row.image.width,
				height: row.image.height
			};

			return {
				s: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 's', 'scf')
			};
		}
	}

	ProductReviewImg.init({
		review_img_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		review_id: {
			type: DataTypes.INTEGER,
		},
		image_id: {
			type: DataTypes.INTEGER,
		},
		sort: {
			type: DataTypes.INTEGER,
		},
		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'product_review_img',
		modelName: 'productReviewImg',
		sequelize
	});

	return ProductReviewImg;
}

// module.exports = function (sequelize, DataTypes) {
// 	return sequelize.define('productReviewImg', {
// 		review_img_id: {
// 			type: DataTypes.INTEGER,
// 			primaryKey: true,
// 			autoIncrement: true
// 		},
// 		review_id: {
// 			type: DataTypes.INTEGER,
// 		},
// 		image_id: {
// 			type: DataTypes.INTEGER,
// 		},
// 		sort: {
// 			type: DataTypes.INTEGER,
// 		},
// 		created_at: {
// 			type: DataTypes.DATE
// 		}
// 	}, {
// 		tableName: 'product_review_img',
// 		classMethods: {
// 			makeThumbsByImgRow(instanceRegistry, row) {
// 				const imgAttrs = {
// 					path: row.image.path,
// 					width: row.image.width,
// 					height: row.image.height
// 				};

// 				return {
// 					s: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 's', 'scf')
// 				};
// 			}
// 		}
// 	});
// };