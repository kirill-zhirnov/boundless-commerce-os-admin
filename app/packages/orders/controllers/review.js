const BasicController = require('../../../modules/controller/basic');

/*
class ReviewController extends BasicController {
	async actionLeave() {
		const {order, customer, items} = await this.getModel('orders').loadOrderPage(
			this.getInstanceRegistry(), this.getParam('id'), this.getLang().lang_id
		);

		if (!order || customer.person_id != this.getUser().getId()) {
			this.rejectHttpError(404, 'Order not found!');
			return;
		}

		const productReview = await this.getModel('productReview').findOne({
			where: {
				order_id: order.order_id,
				status: {
					$ne: 'draft'
				}
			}
		});

		if (productReview) {
			this.setPage('title', this.__('Review already exists'));
			this.render('reviewAlreadyExists');
			return;
		}

		const formKit = this.createFormKit('@p-orders/forms/review/leave', {
			order,
			orderItems: items,
			customer
		}, {
			successMsg: false,
		});

		if (this.isSubmitted()) {
			formKit.process();
		} else {
			this.setPage('title', this.__('Leave a review'));
			const data = await formKit.getWebForm();

			this.render('leave', data);
		}
	}

	async postActionUploadImg() {
		const productReview = await this.getModel('productReview').findOne({
			where: {
				review_id: this.getParam('review'),
				created_by: this.getUser().getId()
			}
		});

		if (!productReview) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const formKit = this.createFormKit('@p-orders/forms/review/imgUploader', {
			productReview
		}, {
			success: (attrs, pk, formKit) => {
				this.json(
					formKit.form.getProductImages()
				);
			}
			// error: () => {
				// for (field, errors of this.form.getFormErrors()) {
				//
				// }
			// }
		});
		formKit.process()
	}

	async actionRmImg() {
		const productReviewImg = await this.getModel('productReviewImg').findOne({
			include: [
				{
					model: this.getModel('productReview'),
					required: true,
					where: {
						created_by: this.getUser().getId(),
						status: 'draft'
					}
				}
			],

			where: {
				review_img_id: this.getParam('imgId')
			}
		});

		if (!productReviewImg) {
			this.rejectHttpError(400, 'Img not found');
			return;
		}

		await productReviewImg.destroy();

		this.json(true);
	}
}

module.exports = ReviewController; */