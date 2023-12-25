import DataProvider from '../../../../modules/dataProvider/index';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';
import validator from '../../../../modules/validator/validator';

export default class StockPerWarehouseDataProvider extends DataProvider {
	constructor(options) {
		if (options == null) {options = {};}
		super(options);

		this.validPageSize = [100, 500, false];

		this.defaults = {
			rmStatus: 0,
			perPage: 100
		};

		this.trackInventory = null;
	}

	async setup() {
		await super.setup();

		this.trackInventory = await this.getRegistry().getSettings().get('inventory', 'trackInventory');
	}

	getRules() {
		return [
			['location_id', 'isNum'],
			['item, available_qty, reserved_qty, price', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const attrs = this.getSafeAttrs();
		//@ts-ignore
		const {location_id, price, available_qty, reserved_qty} = attrs;
		//@ts-ignore
		let {item} = attrs;

		this.q.field('stock.available_qty');
		this.q.field('stock.reserved_qty');

		this.q.field('ii.item_id');
		this.q.field('ii.product_id');
		this.q.field('ii.variant_id');
		this.q.field('ii.type');
		this.q.field('ii.product');
		this.q.field('ii.variant');
		this.q.field('ii.image');
		this.q.field('ii.commodity_group');
		this.q.field('compiled_price.price');

		this.q.from('vw_inventory_item', 'ii');
		this.q.join(`(
			SELECT
				item_id,
				sum(available_qty) as available_qty,
				sum(reserved_qty) as reserved_qty
			FROM
				inventory_stock
			WHERE
				location_id = ${this.getDb().escape(location_id)}
			GROUP BY
				item_id
		)`, 'stock', 'ii.item_id = stock.item_id');
		this.q.left_join(`(
			select
				final_price.item_id,
				coalesce(final_price.min, final_price.value) as price
			from
				final_price
				inner join point_sale using(point_id)
				inner join price using(price_id)
			where
				price.alias = 'selling_price'
		)`, 'compiled_price', 'ii.item_id = compiled_price.item_id');

		this.q.where('(stock.available_qty > 0 or stock.reserved_qty > 0)');
		this.q.where('ii.lang_id = ?', this.getEditingLang().lang_id);

		this.compareNumber('compiled_price.price', price);
		this.compareNumber('stock.available_qty', available_qty);
		this.compareNumber('stock.reserved_qty', reserved_qty);

		if (item && (validator.trim(item) !== '')) {
			item = validator.trim(item).toLowerCase();

			let id = parseInt(item);
			id = isNaN(id) ? 0 : id;

			this.q.where(`
				ii.product_id = ?
				or lower(ii.product ->> 'sku') like ?
				or lower(ii.variant ->> 'sku') like ?
				or lower(ii.product ->> 'title') like ?
				or lower(ii.variant ->> 'title') like ?
			`, id, `%${item}%`, `%${item}%`, `%${item}%`, `%${item}%`);
		}
	}

	sortRules() {
		return {
			default: [{item: 'asc'}],
			attrs: {
				item: {
					//eslint-disable-next-line
					asc: `ii.product ->> 'title' asc`,
					//eslint-disable-next-line
					desc: `ii.product ->> 'title' desc`
				},

				price: 'compiled_price.price',
				available_qty: 'stock.available_qty',
				reserved_qty: 'stock.reserved_qty'
			}
		};
	}

	async getData() {
		await this.validate();

		const safeAttrs = this.getSafeAttrs();

		//@ts-ignore
		if ('location_id' in safeAttrs && (safeAttrs.location_id !== '')) {
			return await super.getData();
		} else {
			this.totalRows = 0;
			return [this.getMetaResult(), []];
		}
	}

	createSummaryQuery() {
		const query = this.q.clone();

		query.resetFields();
		query.resetOrder();

		query.offset(0);
		query.limit(0);

		query.field('sum(stock.available_qty) as total_qty');
		query.field('sum(stock.reserved_qty) as total_reserved');
		query.field('sum( stock.available_qty * coalesce(compiled_price.price,0) ) as total_price');

		return query;
	}

	async prepareData(rows) {
		for (const row of Array.from(rows)) {
			if (row.img_path) {
				row.thumb200 = thumbnailUrl.getAttrs(this.getInstanceRegistry(), {
					path: row.img_path,
					width: row.img_width,
					height: row.img_height
				}, 'scaled', 's');
			}
		}

		let sql = this.createSummaryQuery();
		sql = sql.toParam();

		const data = await this.getDb().sql(sql.text, sql.values);

		return ([this.getMetaResult(), rows, {
			summary: data[0]
		}]);
	}

	//@ts-ignore
	rawOptions() {
		return {
			//@ts-ignore
			location: this.getModel('inventoryLocation').getWarehouseOptions(this.getEditingLang().lang_id)
		};
	}
}