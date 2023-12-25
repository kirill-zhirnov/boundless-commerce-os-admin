const DataProvider = require('../../../../../modules/dataProvider/index');

class ProductReviewsDataProvider extends DataProvider {
	getRules() {
		return [
			['product_title', 'safe'],
		].concat(super.getRules());
	}

	createQuery() {
		const attrs = this.getSafeAttrs();
		const {lang_id} = this.getEditingLang();

		this.q.from('product_review');
		this.q.left_join('product', null, 'product.product_id = product_review.product_id');
		this.q.left_join(
			'product_text',
			null,
			`product_text.product_id = product.product_id and product_text.lang_id = ${this.getDb().escape(lang_id)}`
		);
		this.q.left_join('orders', null, 'orders.order_id = product_review.order_id');
		this.q.left_join('person', null, 'person.person_id = product_review.created_by');

		this.q.where('product_review.status != ?', 'draft');
		this.compare('product_text.title', attrs.product_title);
	}

	sortRules() {
		return {
			default: [{created_at : 'desc'}],
			attrs: {
				created_at: 'product_review.created_at'
			}
		};
	}
}

module.exports = ProductReviewsDataProvider;
