const GridResource = require('../../../../../modules/controller/resources/grid');

class ProductReviewsController extends GridResource {
	init() {
		super.init();

		this.grid = {
			widget: 'catalog.productReviewsGrid.@c',
			provider: '@p-catalog/dataProvider/admin/product/reviews',
			model: 'productReview'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Product reviews')
		});

		super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/product/review', {
		}, {
			// successMsg: false,
			// beforeJson: () => {
			// 	this.metaLocationRedirect(formKit.form.getDownloadRedirect());
			// },
		});

		if (this.isSubmitted()) {
			formKit.process();
		} else {
			const data = await formKit.getWebForm()
			console.log('---data---', data);
			this.modal('form', {data}, 'title?', null, {});
		}
	}
}

module.exports = ProductReviewsController;