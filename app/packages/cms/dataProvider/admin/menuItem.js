import DataProvider from '../../../../modules/dataProvider/index';
import Backbone from '../../../../modules/backbone/index.client';
import _ from 'underscore';

export default class MenuItemDataProvider extends DataProvider {
	constructor(options) {
		super(options);
		this.menuBlock = null;
	}

	async setup() {
		await super.setup();
		return this.loadMenuBlock();
	}

	async getTplData() {
		let data = null;

		const d = await super.getTplData();
		data = d;
		//@ts-ignore
		data.block = this.menuBlock;

		const isEmpty = await this.isEmpty();
		//@ts-ignore
		data.isEmpty = isEmpty;

		return data;
	}

	async isEmpty() {
		let res;

		//@ts-ignore
		if (this.menuBlock.key === 'category') {
			res = await this.getModel('categoryMenuRel').count({
				where: {
					//@ts-ignore
					block_id: this.menuBlock.block_id
				}
			});
		} else {
			res = await this.getDb().sql('\
select \
count(*) as qty \
from \
vw_menu_item_tree \
where \
block_id = :blockId\
', {
				//@ts-ignore
				blockId: this.menuBlock.block_id,
				langId: this.getEditingLang().lang_id
			});
		}

		if (_.isArray(res)) {
			//@ts-ignore
			res = Number(res[0].qty);
		}

		return res === 0;
	}

	getRules() {
		return [
			['title,type', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	getTreeCollection() {
		//@ts-ignore
		switch (this.menuBlock.config.type) {
			case 'basic':
				return this.getBasicTreeCollection();

			case 'category':
				return this.getCategoryTreeCollection();
		}
	}

	async getCategoryTreeCollection() {
		const dataProvider = await this.getController().createDataProvider('@p-catalog/dataProvider/admin/category', {}, {
			//@ts-ignore
			inMenu: this.menuBlock.key
		});

		//@ts-ignore
		const collection = await dataProvider.getTreeCollection();
		return collection;
	}

	async getBasicTreeCollection() {
		const sql = await this.createSql();

		if (!_.isObject(sql) || !sql.text || !sql.values) {
			throw new Error('createSql should return/resolve with object with: \'text\' and \'values\' props.');
		}

		const rows = await this.getDb().sql(sql.text, sql.values);

		//@ts-ignore
		const collection = new Backbone.TreeCollection();

		for (let row of Array.from(rows)) {
			var parent;
			//@ts-ignore
			if ((row.parent_id != null) && !this.isFilterActive()) {
				//@ts-ignore
				const result = collection.where({id: row.parent_id}, {deep: true});

				if (result.length === 0) {
					continue;
				}
				// throw new Error "Parent with ID '#{row.parent_id}' not found!"
				parent = result[0];
			} else {
				parent = collection;
			}

			parent.add(_.extend({
				//@ts-ignore
				id: row.item_id,
				url: this.getUrl(row),
				title: this.getTitleByRow(row)
			}, _.pick(row, ['parent_id', 'type', 'highlight', 'css_class']))
			);
		}

		return collection;
	}

	getTitleByRow(row) {
		let title;
		switch (row.type) {
			case 'category':
				title = row.category_title;
				break;
			case 'product':
				title = row.product_title;
				break;
			case 'page':
				title = row.page_title;
				break;
			default:
				({
					title
				} = row);
		}

		return title;
	}

	createQuery() {
		this.q.distinct();
		this.q.field('vw_menu_item_tree.*');
		this.q.field('ct.title', 'category_title');
		this.q.field('pg.title', 'page_title');
		this.q.field('pt.title', 'product_title');
		this.q.from('vw_menu_item_tree');
		this.q.left_join('category_text', 'ct', 'ct.category_id = vw_menu_item_tree.category_id and ct.lang_id = vw_menu_item_tree.lang_id');
		this.q.left_join('page', 'pg', 'pg.page_id = vw_menu_item_tree.page_id and pg.lang_id = vw_menu_item_tree.lang_id');
		this.q.left_join('product_text', 'pt', 'pt.product_id = vw_menu_item_tree.product_id and pt.lang_id = vw_menu_item_tree.lang_id');
		//@ts-ignore
		this.q.where('block_id = ?', this.menuBlock.block_id);
		this.q.where('vw_menu_item_tree.lang_id = ?', this.getEditingLang().lang_id);

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		if (attrs.title && (attrs.title !== '')) {
			//@ts-ignore
			const title = `%${attrs.title.toLowerCase()}%`;
			this.q.where('\
(lower(vw_menu_item_tree.title) like ?) \
or (lower(ct.title) like ?) \
or (lower(pg.title) like ?) \
or (lower(pt.title) like ?)\
', title, title, title, title);
		}

		return this.compare('vw_menu_item_tree.type', this.getSafeAttr('type'));
	}

	sortRules() {
		return {
			default: [{tree_sort: 'asc'}],
			attrs: {
				tree_sort: 'tree_sort'
			}
		};
	}

	async createSql() {
		this.q = this.squelSelect();

		await this.createQuery();
		const sql = await this.getSortSql();

		if (!this.isFilterActive() && sql) {
			await this.q.order(sql, null);
		}

		return this.q.toParam();
	}

	shallSort() {
		return true;
	}

	isFilterActive() {
		const attrs = _.pick(this.getSafeAttrs(), ['title']);

		for (let attr in attrs) {
			const val = attrs[attr];
			if (val && (val !== '0')) {
				return true;
			}
		}

		return false;
	}

	async loadMenuBlock() {
		const menu = this.getView().getMenu();
		//@ts-ignore
		const item = this.attributes.item;
		if (!(item in menu)) {
			throw new Error('Menu not found!');
		}

		const [block] = await this.getModel('menuBlock').findOrCreate({
			where: {
				site_id: this.getEditingSite().site_id,
				key: item
			},
			defaults: {
				site_id: this.getEditingSite().site_id,
				key: item
			}
		});

		//@ts-ignore
		this.menuBlock = block.toJSON();

		_.extend(this.menuBlock, {
			config: menu[item]
		});
	}

	getUrl(row) {
		switch (row.type) {
			case 'page':
				//@ts-ignore
				return this.getModel('page').getUrl({
					page_id: row.page_id,
					url_key: row.page_url_key
				});

			case 'product':
				return this.url('@product', {
					id: row.page_url_key ? row.page_url_key : row.product_id
				});

			case 'category':
				return this.url('@category', {
					id: row.page_url_key ? row.page_url_key : row.category_id
				});

			case 'url':
				return row.url;
		}
	}


	//@ts-ignore
	rawOptions() {
		return {
			type: this.getTypeOptions()
		};
	}

	getTypeOptions() {
		return [
			['', this.getI18n().__('All types')],
			['folder', this.getI18n().__('Folder')],
			['page', this.getI18n().__('Page')],
			['category', this.getI18n().__('Category')],
			['product', this.getI18n().__('Product')],
			['url', this.getI18n().__('URL')]
		];
	}
}