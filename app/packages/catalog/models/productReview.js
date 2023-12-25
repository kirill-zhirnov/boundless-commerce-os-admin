import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ProductReview extends ExtendedModel {
		static appendThumbToImgs(instanceRegistry, row) {
			if (Array.isArray(row.productReviewImgs)) {
				for (const productReviewImg of row.productReviewImgs) {
					Object.assign(productReviewImg, {
						//@ts-ignore
						thumb: this.sequelize.model('productReviewImg').makeThumbsByImgRow(
							instanceRegistry, productReviewImg
						)
					});
				}
			}
		}

		static async makeDraftRow(userId) {
			await this.sequelize.sql(`
				insert into product_review
					(status, created_by)
				values
					('draft', :userId)
				on conflict do nothing
			`, {
				userId
			});

			return this.findOne({
				where: {
					status: 'draft',
					created_by: userId
				}
			});
		}

		// static getImgsByRow(instanceRegistry, row) {
		// 	const out = [];
		//
		// 	if (Array.isArray(row.productReviewImgs)) {
		// 		for (const productReviewImg of row.productReviewImgs) {
		// 			const imgAttrs = {
		// 				path: productReviewImg.image.path,
		// 				width: productReviewImg.image.width,
		// 				height: productReviewImg.image.height
		// 			};
		//
		// 			const item = {
		// 				s: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 's', 'scf')
		// 			};
		//
		// 			out.push(item);
		// 		}
		// 	}
		//
		// 	return out;
		// }
	}

	ProductReview.init({
		review_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		order_id: {
			type: DataTypes.INTEGER,
		},
		product_id: {
			type: DataTypes.INTEGER,
		},
		name: {
			type: DataTypes.STRING(255)
		},
		rating: {
			type: DataTypes.INTEGER,
		},
		text: {
			type: DataTypes.TEXT
		},
		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},
		created_by: {
			type: DataTypes.INTEGER,
		},
		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'product_review',
		modelName: 'productReview',
		sequelize
	});

	return ProductReview;
}