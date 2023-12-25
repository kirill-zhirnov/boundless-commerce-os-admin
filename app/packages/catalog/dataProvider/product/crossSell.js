import ProductDataProvider from '../product';

//@ts-ignore
export default class CrossSell extends ProductDataProvider {
	constructor(options) {
		super(options);

		//@ts-ignore
		this.validPageSize = [false];
		this.defaults.perPage = false;

		const {categoryId, productId, categoryAlias} = options;
		this.categoryId = categoryId;
		this.productId = productId;
		this.categoryAlias = categoryAlias;

		this.distinctOn = 'select distinct on(p.product_id, cross_sell.sort, cross_sell_id) ';
	}

	createQuery() {
		this.createBaseQuery();

		this.q.join('cross_sell', null, 'cross_sell.rel_product_id = p.product_id');
		this.q.join('cross_sell_category', null, 'cross_sell.category_id = cross_sell_category.category_id');

		if (this.categoryId) {
			this.q.where('cross_sell.category_id = ?', this.categoryId);
		} else if (this.categoryAlias) {
			this.q.where('cross_sell_category.alias = ?', this.categoryAlias);
		} else {
			throw new Error('You need to pass categoryId or alias!');
		}

		this.q.where('cross_sell.product_id = ?', this.productId);
		this.q.where('p.status = \'published\' and p.deleted_at is null');

		this.q.order('cross_sell.sort asc nulls last', null);
		this.q.order('cross_sell_id asc', null);
	}

	getPageSize() {
		return false;
	}

	validateCategory() {
		return true;
	}

	getSortSql() {
		return false;
	}
}