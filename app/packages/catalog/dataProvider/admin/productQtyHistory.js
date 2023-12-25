import ChangeQtyDataProvider from '../../../inventory/dataProvider/admin/changeQty';

export default class ProductQtyHistory extends ChangeQtyDataProvider {
	constructor() {
		//@ts-ignore
		super(...arguments);

		this.product = null;
	}

	getRules() {
		return [
			['product_id', 'required'],
			['product_id', 'isNum'],
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		super.createQuery();

		//@ts-ignore
		return this.q.where('i.product_id = ? or vp.product_id = ?', this.product.product_id, this.product.product_id);
	}

	async setup() {
		await super.setup();
		await this.setupProduct();
	}

	async setupProduct() {
		const [row] = await this.getDb().sql(`
			select
				product_id,
				count(variant_id)::int as variants
			from
				product
			left join variant using(product_id)
			where
				product_id = :product
			group by product_id
		`, {
			//@ts-ignore
			product: this.attributes.product_id
		});
		if (!row) {
			throw new Error('Product not found!');
		}

		this.product = row;
	}

	async getTplData() {
		const data = await super.getTplData();
		Object.assign(data, {product: this.product});

		return data;
	}
}