const CmsImageUploader = require('../../../cms/forms/admin/imageUploader');

class ReviewImageUploader extends CmsImageUploader {
	constructor(options) {
		super(options);

		this.productReview = options.productReview;

		if (!this.productReview)
			throw new Error('Product review have to be specified.');

		this.productImages = null;
	}

	async save() {
		await super.save();

		for (const img of this.uploadedImages) {
			await this.getDb().sql(`
				insert into product_review_img
					(review_id, image_id, sort)
				select
					:review, :image, coalesce(max(sort), 0) + 10
				from
					product_review_img
				where
					review_id = :review
			`, {
				review: this.productReview.review_id,
				image: img.image_id
			});
		}

		const productReviewImgs = await this.getModel('productReviewImg').findAll({
			include: [{
				model: this.getModel('image'),
				required: true
			}],
			where: {
				review_id: this.productReview.review_id
			},
			order: 'sort asc'
		});

		const review = {
			productReviewImgs: productReviewImgs.map((row) => row.toJSON())
		};

		this.getModel('productReview').appendThumbToImgs(this.getInstanceRegistry(), review);

		this.productImages = review.productReviewImgs;
	}

	getProductImages() {
		return this.productImages;
	}
}

module.exports = ReviewImageUploader;