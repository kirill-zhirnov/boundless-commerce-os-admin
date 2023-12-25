const Form = require('../../../../modules/form/index');

class ProductReviewForm extends Form {
	getRules() {
		return [
			['product_id, name, rating, text, status', 'required'],
			['product_id', 'validateProductId'],
			['rating', 'inOptions', {options: [['1'], ['2'], ['3'], ['4'], ['5']]}],
			['status', 'inOptions', {options: 'status'}]
		];
	}

	async save() {
		console.log('--- soon :)');

	}

	rawOptions() {
		return {
			status: [
				['published', this.p__('status', 'Published')],
				['hidden', this.p__('status', 'Hidden')]
			]
		}
	}

	async setupAttrs() {
		if (!this.pk) {
			const row = await this.getModel('productReview').makeDraftRow(
				this.getUser().getId()
			);
			this.pk = row.review_id;
		}

		return super.setupAttrs();
	}

	loadRecord() {
		return this.getModel('productReview').findException({
			where: {
				review_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		this.setAttributes(
			this.record.toJSON()
		);
	}

	async getTplData() {
		const data = await super.getTplData();
		data.images = await this.loadImages();

		return data;
	}

	async loadImages() {
		const productReviewImgs = await this.getModel('productReviewImg').findAll({
			include: [{
				model: this.getModel('image'),
				required: true
			}],
			where: {
				review_id: this.pk
			},
			order: 'sort asc'
		});

		const review = {
			productReviewImgs: productReviewImgs.map((row) => row.toJSON())
		};
		this.getModel('productReview').appendThumbToImgs(this.getInstanceRegistry(), review);

		return review.productReviewImgs;
	}

	async validateProductId(value, options, field) {
		const product = await this.getModel('product').findOne({
			where: {
				product_id: value
			}
		});

		if (!product) {
			this.addError(field, 'noProduct', 'Product not found');
		}
	}
}

module.exports = ProductReviewForm;