import DataProvider from '../../../../../modules/dataProvider/index';
import _ from 'underscore';

export default class ProductCategoryTree extends DataProvider {
	constructor(options) {
		super(options);

		this.idPrefix = 'category-';
	}

	getRules() {
		return [
			['product_id', 'isNum'],
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		let attrs = this.getSafeAttrs();

		this.q.field('vw.category_id');
		this.q.field('vw.parent_id');
		this.q.field('vw.title');
		this.q.field('vw.url_key');
		this.q.field('children_qty.qty::int', 'sub_qty');

		this.q.from('vw_category_option', 'vw');
		this.q.left_join(`
				(
					select
						category.site_id,
						category.category_id,
						count(children.category_id) as qty
					from
						category
						left join category as children on
							category.category_id = children.parent_id
							and category.site_id = children.site_id
							and children.deleted_at is null
					group by
						category.category_id
				)
			`,
			'children_qty',
			'vw.site_id = children_qty.site_id and vw.category_id = children_qty.category_id'
		);

		this.q.where('vw.site_id = ?', this.getSite().site_id);
		this.q.where('vw.lang_id = ?', this.getLang().lang_id);

		this.compareRmStatus('vw.deleted_at');

		//@ts-ignore
		if (attrs.product_id) {
			this.q.field('p.product_id');
			this.q.field('p.is_default');

			this.q.left_join(
				'product_category_rel', 'p',
				//@ts-ignore
				`vw.category_id = p.category_id and p.product_id = ${this.getDb().escape(attrs.product_id)}`
			);
		}
	}

	//@ts-ignore
	async prepareData(rows) {
		let tree = [],
			checked= []
		;

		rows.forEach((row) => {
			let parent = this.findParent(tree, row);

			//if parent not found - it is removed (has deleted_at).
			if (!parent)
				return;

			//show checked only end categories in browser
			let isChecked = (row.product_id && !row.sub_qty) ? true : false,
			item = {
				id: `${this.idPrefix}${row.category_id}`,
				text: row.title,
				data: _.pick(row, ['category_id', 'is_default']),
				state: {
					selected: (isChecked) ? true : false
				}
			};

			parent.push(item);

			if (isChecked)
				checked.push(row.category_id);
		});

		return {
			tree,
			checked
		};
	}

	findParent(out, category) {
		if (!category.parent_id)
			return out;

		for (let i = 0; i < out.length; i++) {
			if (out[i].data.category_id == category.parent_id) {
				if (!out[i].children)
					out[i].children = [];

				return out[i].children;
			}

			if (out[i].children) {
				let childrenRes = this.findParent(out[i].children, category);
				if (childrenRes)
					return childrenRes;
			}
		}

		return null;
	}

	sortRules() {
		return {
			default: [{tree_sort: 'asc'}],
			attrs: {
				tree_sort: 'vw.tree_sort'
			}
		};
	}

	getPageSize() {
		return false;
	}
}