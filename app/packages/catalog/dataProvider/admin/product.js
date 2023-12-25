import DataProvider from '../../../../modules/dataProvider';
import validator from '../../../../modules/validator/validator';

export default class ProductDataProvider extends DataProvider {
	constructor(options) {
		super(options);

		this.priceCondition = this.priceCondition.bind(this);

		this.validPageSize = [10, 25, 50, 100];

		this.defaults = {
			rmStatus: 0,
			perPage: 50,
			category_id: 0
		};
	}

	initialize(options) {
		this.trackInventory = null;
		this.imgProportion = null;

		this.isExport = options.isExport || false;
	}

	async setup() {
		await super.setup();

		this.trackInventory = await this.getInstanceRegistry().getSettings().get('inventory', 'trackInventory');
		this.imgProportion = await this.getInstanceRegistry().getSettings().get('system', 'imgProportion');
	}

	//@ts-ignore
	getRules() {
		return [
			['product,price,stock,available_qty', 'safe'],
			[
				'manufacturer_id,category_id,group_id,label_id,collection_id,import_log_id,product_id',
				'isNum'
			],
			['status', 'inOptions', {options: 'status'}],
			['has_variants', 'inOptions', {options: 'hasVariants'}],

			//			attributes for export widget
			['descriptionAsHtml', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const attrs = this.getSafeAttrs();
		//@ts-ignore
		const {manufacturer_id, group_id, product_id, status, has_variants} = attrs;
		//@ts-ignore
		const {category_id, label_id, collection_id, available_qty, stock, product, import_log_id} = attrs;
		const escapedLang = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('p.product_id');
		this.q.field('p.sku');
		this.q.field('p.has_variants');
		this.q.field('p.status');
		this.q.field('p.created_at');
		this.q.field('p.deleted_at');
		this.q.field('pt.title');
		this.q.field('pt.url_key');

		//		Price columns:
		this.q.field('fp.value', 'price');
		this.q.field('fp.min', 'price_min');
		this.q.field('fp.max', 'price_max');
		this.q.field('fp.old', 'price_old');
		this.q.field('fp.old_min', 'price_old_min');
		this.q.field('fp.old_max', 'price_old_max');
		this.q.field('coalesce(fp.min, fp.value)', 'sort_price');

		this.q.field('pp.available_qty');
		this.q.field('pp.reserved_qty');
		this.q.field('pg.not_track_inventory', 'product_not_track_inventory');

		this.q.field('image.path', 'img_path');
		this.q.field('image.width', 'img_width');
		this.q.field('image.height', 'img_height');

		this.q.field('manufacturer_text.title', 'manufacturer_title');
		this.q.field('commodity_group_text.title', 'commodity_group_title');

		this.q.distinct();

		this.q.from('product', 'p');
		this.q.join('product_text', 'pt', 'pt.product_id = p.product_id');
		this.q.join('inventory_item', 'i', 'p.product_id = i.product_id');
		this.q.join('product_prop', 'pp', 'p.product_id = pp.product_id');
		this.q.left_join(`
			(
				select
					final_price.*
				from
					final_price
					inner join point_sale using(point_id)
					inner join price using(price_id)
				where
					site_id = '${this.getDb().escape(this.getEditingSite().site_id)}'
					and price.alias = 'selling_price'
			)
		`, 'fp', 'fp.item_id = i.item_id');

		this.q.left_join('commodity_group', 'pg', 'pg.group_id = p.group_id');
		this.q.left_join(
			'commodity_group_text',
			null,
			`commodity_group_text.group_id = pg.group_id and commodity_group_text.lang_id = ${escapedLang}`
		);
		this.q.left_join('product_image', null, 'product_image.product_id = p.product_id and product_image.is_default is true');
		this.q.left_join('image', null, 'product_image.image_id = image.image_id and image.deleted_at is null');
		this.q.left_join('manufacturer', null, 'manufacturer.manufacturer_id = p.manufacturer_id');
		this.q.left_join(
			'manufacturer_text',
			null,
			`manufacturer.manufacturer_id = manufacturer_text.manufacturer_id and manufacturer_text.lang_id = ${escapedLang}`
		);

		this.q.where('p.status != \'draft\'');
		this.compareRmStatus('p.deleted_at');

		this.q.where('pt.lang_id = ?', this.getEditingLang().lang_id);

		this.compare('p.manufacturer_id', manufacturer_id);
		this.compare('p.group_id', group_id);
		this.compare('p.product_id', product_id);
		this.compare('p.status', status);

		if (['0', '1'].indexOf(has_variants) !== -1) {
			if (has_variants === '1') {
				this.q.where('p.has_variants is true');
			} else {
				this.q.where('p.has_variants is false');
			}
		}

		if (this.isExport) {
			this.q.field('pt.description');
		}

		const categoryId = parseInt(category_id);
		if (!isNaN(categoryId) && categoryId !== 0) {
			if (categoryId === -1) {
				this.q.where('not exists (select 1 from product_category_rel where product_category_rel.product_id = p.product_id)');
			} else {
				this.q.join(
					'product_category_rel',
					'category_rel',
					'p.product_id = category_rel.product_id'
				);
				this.q.where('category_rel.category_id = ?', categoryId);
			}
		}

		if (label_id) {
			this.q.join(
				'product_label_rel',
				'label_rel',
				`p.product_id = label_rel.product_id and label_rel.label_id = ${this.getDb().escape(label_id)}`
			);
		}

		if (collection_id) {
			this.q.join(
				'collection_product_rel',
				'cpr',
				`p.product_id = cpr.product_id and cpr.collection_id = ${this.getDb().escape(collection_id)}`
			);
		}

		//		fixme: allow to search with ><
		this.compareNumber('pp.available_qty', available_qty);

		if (stock) {
			switch (stock) {
				case 'in_stock':
					this.q.where('pp.available_qty > 0 or pg.not_track_inventory is true');
					break;

				case 'out_stock':
					this.q.where('pp.available_qty = 0 and (pg.not_track_inventory is false or pg.not_track_inventory is null)');
					break;

				case 'not_tracked':
					this.q.where('pg.not_track_inventory is true');
					break;
			}
		}


		const productSearch = validator.trim(product);
		if (product && productSearch.length >= 3) {
			const _product = productSearch.toLowerCase();

			let id = parseInt(_product);
			id = isNaN(id) ? 0 : id;

			let searchQuery = ['p.product_id = ?'];
			let searchParams = [id];

			// if (String(_product).length >= 3) {
			searchQuery = searchQuery.concat([
				'lower(p.sku) like ?', 'lower(pt.title) like ?', 'lower(pt.custom_title) like ?',
				'lower(pt.url_key) like ?', 'lower(pt.description) like ?'
			]);
			searchParams = searchParams.concat([`%${_product}%`, `%${_product}%`, `%${_product}%`, `%${_product}%`, `%${_product}%`]);
			// }

			this.q.where.apply(this.q, [searchQuery.join(' or ')].concat(searchParams));
		}

		if (import_log_id) {
			this.q.join('product_import_rel', null, `product_import_rel.product_id = p.product_id and product_import_rel.log_id = ${this.getDb().escape(import_log_id)}`);
		}

		this.compareNumber(null, this.getSafeAttr('price'), this.priceCondition);
	}

	createCalcRowsQuery() {
		const calcRowsQuery = this.q.clone();
		calcRowsQuery.resetFields();
		calcRowsQuery.resetOrder();
		calcRowsQuery.field('count(distinct p.product_id) as total_rows');

		return calcRowsQuery;
	}

	priceCondition(operator, searchValue) {
		switch (operator) {
			case '>':
				return this.q.where('fp.value >= ? or fp.min >= ?', searchValue, searchValue);

			case '<':
				return this.q.where('fp.value <= ? or fp.min <= ?', searchValue, searchValue);

			default:
				return this.q.where('fp.value = ? or (fp.min <= ? and fp.max >= ?)', searchValue, searchValue, searchValue);
		}
	}

	sortRules() {
		return {
			default: [{product: 'asc'}],
			attrs: {
				product: 'pt.title',
				price: 'sort_price',
				stock: 'pp.available_qty',
				product_id: 'p.product_id',
				created_at: 'p.created_at'
			}
		};
	}

	async prepareData(rows) {
		let row;
		const ProductModel = this.getModel('product');

		const productIds = [];
		for (let i = 0; i < rows.length; i++) {
			row = rows[i];
			//@ts-ignore
			row = ProductModel.prepareRow(row, this.trackInventory, this.imgProportion, this.getInstanceRegistry());

			rows[i] = row;
			productIds.push(row['product_id']);

			productIds.push(row['product_id']);
		}

		//@ts-ignore
		const labels = await this.getModel('label').findLabelsByProducts(productIds, this.getEditingLang().lang_id);
		//@ts-ignore
		const collections = await this.getModel('collection').findCollectionsByProducts(productIds, this.getEditingSite().site_id, this.getEditingLang().lang_id);

		for (row of Array.from(rows)) {
			row.labels = labels[row.product_id] || [];
			row.collections = collections[row.product_id] || '';
		}

		return [this.getMetaResult(), rows];
	}

	//@ts-ignore
	rawOptions() {
		return {
			//@ts-ignore
			manufacturer: this.getModel('manufacturer').findOptions(this.getEditingLang().lang_id),
			//@ts-ignore
			group: this.getModel('commodityGroup').fetchOptions(this.getEditingLang().lang_id),
			//@ts-ignore
			category: this.fetchCategoryOptions(),
			stock: this.getStockOptions(),
			//@ts-ignore
			label: this.getModel('label').findOptions(this.getEditingLang().lang_id),
			//@ts-ignore
			collection: this.getModel('collection').fetchOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id),
			//@ts-ignore
			import: this.getModel('productImportLog').findOptions(this.getEditingSite().site_id, this.getEditingLang()),
			status: [
				['published', this.__('Yes')],
				['hidden', this.__('No')],
			],
			hasVariants: [
				['1', this.__('Yes')],
				['0', this.__('No')],
			]
		};
	}

	async fetchCategoryOptions() {
		//@ts-ignore
		const categories = await this.getModel('category').findOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id, this.getI18n());

		return [
			[0, 'All'],
			[-1, 'Products without category'],
		].concat(categories);
	}

	getStockOptions() {
		return [
			['', this.getI18n().__('All')],
			['in_stock', this.getI18n().__('In stock')],
			['out_stock', this.getI18n().__('Out of stock')],
			['not_tracked', this.getI18n().__('Not tracked')],
		];
	}
}
