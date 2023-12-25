import ProductCategoryTree from './categoryTree';

export default class ProductCategoryTreeForFilter extends ProductCategoryTree {
	getRules() {
		return [];
	}

	createQuery() {
		this.q.field('vw.category_id');
		this.q.field('vw.parent_id');
		this.q.field('vw.title');
		this.q.field('vw.level');
		this.q.field('coalesce(products_calc.products_qty, 0) as products_qty');

		this.q.from('vw_category_option', 'vw');
		this.q.left_join(`
			(
				select
					category_id,
					count(product_id) as products_qty
				from
					product_category_rel
					inner join product using(product_id)
				where
					product.status != 'draft'
					and product.deleted_at is null
				group by category_id
			)
		`, 'products_calc', 'vw.category_id = products_calc.category_id');

		this.q.where('vw.site_id = ?', this.getEditingSite().site_id);
		this.q.where('vw.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('vw.status != ? and vw.deleted_at is null', 'draft');
		this.q.order('vw.tree_sort asc', null);
	}

	//@ts-ignore
	async prepareData(rows) {
		const totalProducts = await this.calcTotalProducts();
		const productsWithoutCategories = await this.calcProductsWithoutCategories();

		const tree = [
			{
				id: `${this.idPrefix}0`,
				text: this.__('All (%s)', [totalProducts]),
				data: {
					category_id: 0
				}
			},
			{
				id: `${this.idPrefix}-1`,
				text: this.__('Products without category (%s)', [productsWithoutCategories]),
				data: {
					category_id: -1
				}
			},
		];

		for (const row of rows) {
			const parent = this.findParent(tree, row);
			if (!parent) {
				continue;
			}

			const {category_id, title, products_qty} = row;
			const item = {
				id: `${this.idPrefix}${category_id}`,
				text: `${title} (${products_qty})`,
				data: {
					category_id,
					products_qty
				},
				state: {
					selected: false
				}
			};

			parent.push(item);
		}

		return {
			tree
		};
	}

	async calcTotalProducts(): Promise<number> {
		const [{total}] = await this.getDb().sql<{total: number}>(`
			select
				count(*) as total
			from
				product
			where
				product.status != 'draft'
				and product.deleted_at is null
		`);

		return total;
	}

	async calcProductsWithoutCategories(): Promise<number> {
		const [{total}] = await this.getDb().sql<{total: number}>(`
			select
				count(*) as total
			from
				product
			where
				product.status != 'draft'
				and product.deleted_at is null
				and not exists (
					select 1 from product_category_rel where product_category_rel.product_id = product.product_id
				)
		`);

		return total;
	}
}