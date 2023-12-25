import Form from '../../../../modules/form/index';
import Q from 'q';

export default class CategoryProductsSort extends Form {
	getRules() {
		return [
			['products,category', 'required'],
			['category', 'isNum'],
			['moveToTop', 'safe']
		];
	}

	save() {
		//@ts-ignore
		const {products, moveToTop} = this.getSafeAttrs();

		if (!Array.isArray(products))
			return Q();

		if (moveToTop == '1') {
			return this.moveProductsToTheBeginning();
		} else {
			return this.saveNormalSort();
		}
	}

	async moveProductsToTheBeginning() {
		//@ts-ignore
		const {category, products} = this.getSafeAttrs();

		const val = await this.findMinByCategory(category);
		let min = val - 10;

		let i = 0;
		for (const productId of products) {
			await this.setProductSort(
				category,
				productId,
				(products.length - i - 1) * -10 + min
			);
			i++;
		}
	}

	async saveNormalSort() {
		//@ts-ignore
		const {category, products} = this.getSafeAttrs();

		const val = await this.findMinByCategory(category);
		let min = val;

		let i = 0;
		for (const productId of products) {
			await this.setProductSort(category, productId, (i * 10 + min));
			i++;
		}
	}

	setProductSort(categoryId, productId, sort) {
		return this.getDb().sql(`
			update product_category_rel
			set
				sort = :sort
			where
				category_id = :category
				and product_id = :product
		`, {
			sort: sort,
			category: categoryId,
			product: productId
		});
	}

	async findMinByCategory(category) {
		const [row] = await this.getDb().sql(`
			select
				coalesce(min(sort), 0) as min
			from
				product_category_rel
			where
				category_id = :category
		`, {
			category: category
		});

		//@ts-ignore
		return row.min;
	}
}