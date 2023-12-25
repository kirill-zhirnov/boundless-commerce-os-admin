const Form = require('../../../../modules/form/index');

class LeaveReviewForm extends Form {
	constructor(options = {}) {
		super(options);

		this.order = options.order;
		this.orderItems = options.orderItems;
		this.customer = options.customer;

		this.productReviews = null;

		if (!this.order)
			throw new Error('Order must be specified.');
	}

	getRules() {
		return [
			['name', 'required'],
			['rating', 'validateReviews'],
			['review', 'safe']
		];
	}

	async setup() {
		await super.setup();

		for (const item of this.orderItems.items) {
			await this.getDb().sql(`
				insert into product_review
					(order_id, product_id, created_by, status)
				values
					(:order, :product, :person, 'draft')
				on conflict do nothing
			`, {
				order: this.order.order_id,
				product: item.product_id,
				person: this.getUser().getId()
			});
		}

		const attrs = {
			name: this.customer.first_name,
			rating: {},
			review: {}
		};

		this.productReviews = await this.getModel('productReview').findAll({
			include: [{
				model: this.getModel('productReviewImg'),
				order: 'product_review_img.sort',
				include: [{
					model: this.getModel('image')
				}]
			}],
			where: {
				order_id: this.order.order_id
			},
			order: 'review_id asc'
		});

		for (const row of this.productReviews) {
			attrs.rating[row.review_id] = row.rating;
			attrs.review[row.review_id] = row.text;
		}

		this.setAttributes(attrs);
	}

	async validateReviews(value, options, field, attrs) {
		let postedReviews = 0;
		for (const review of this.productReviews) {
			const rowKey = `id-${review.review_id}`;
			const imgsQty = await this.getModel('productReviewImg').count({
				where: {
					review_id: review.review_id
				}
			});

			if (attrs.rating[rowKey] == '' && attrs.review[rowKey] == '' && imgsQty == 0)
				continue;

			postedReviews++;
			if (!attrs.rating[rowKey]) {
				this.addError(`rating[${rowKey}]`, 'required', this.__('Please, rate the product.'));
			}

			if (!attrs.review[rowKey]) {
				this.addError(`review[${rowKey}]`, 'required', this.__('Please share with us few words about the product.'));
			}
		}

		if (!postedReviews) {
			const rowKey = `id-${this.productReviews[0].review_id}`;

			this.addError(`rating[${rowKey}]`, 'required', this.__('Please, rate at lease one product.'));
		}
	}

	async save() {
		const attrs = this.getSafeAttrs();

		for (const review of this.productReviews) {
			const rowKey = `id-${review.review_id}`;

			if (attrs.rating[rowKey] == '')
				continue;

			await this.getModel('productReview').update({
				name: attrs.name,
				rating: attrs.rating[rowKey],
				text: attrs.review[rowKey],
				status: 'hidden',
				created_at: this.getDb().fn('now')
			}, {
				where: {
					review_id: review.review_id
				}
			});
		}

		return true;
	}

	async getTplData() {
		const data = await super.getTplData();

		data.order = this.order;
		data.orderItems = this.orderItems;

		const instanceRegistry = this.getInstanceRegistry();
		data.reviews = this.productReviews.map((row) => {
			const outRow = row.toJSON();
			this.getModel('productReview').appendThumbToImgs(instanceRegistry, outRow);

			return outRow;
		});
			// const imgThumbs = this.getModel('productReview').getImgsByRow(this.getInstanceRegistry(), row);
			//
			// return Object.assign(row.toJSON(), {
			// 	imgThumbs
			// });
		// });



		return data;
	}
}

module.exports = LeaveReviewForm;