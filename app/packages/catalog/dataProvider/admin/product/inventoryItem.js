import ProductDataProvider from '../product';
import _ from 'underscore';
import validator from '../../../../../modules/validator/validator';
import {sqlAggArr2Objects} from '../../../../../modules/utils/sql';

export default class ProductInventoryItemDataProvider extends ProductDataProvider {
	constructor(options) {
		super(options);

		this.locations = null;
		this.prices = null;
		this.pointOfSale = null;
	}

	async setup() {
		await super.setup();

		//@ts-ignore
		this.locations = await this.getModel('inventoryLocation').loadAllLocations(
			this.getEditingLang().lang_id
		);

		//@ts-ignore
		this.prices = await this.getModel('price').loadAllPrices(this.getEditingLang().lang_id);

		this.pointOfSale = await this.getModel('pointSale').findOne({
			where: {
				site_id: this.getEditingSite().site_id
			}
		});
	}

	createQuery() {
		//@ts-ignore
		const {manufacturer_id, group_id, product_id, status, has_variants, category_id, label_id} = this.getSafeAttrs();
		//@ts-ignore
		const {collection_id, available_qty, price, stock, product, import_log_id} = this.getSafeAttrs();

		//@ts-ignore
		const escapedPointId = this.getDb().escape(this.pointOfSale.point_id);

		this.q.field('vw.*');
		this.q.field('product_text.description', 'product_description');
		this.q.field('stock_by_location.stock', 'stock_by_location');
		this.q.field('manufacturer_text.title', 'manufacturer_title');
		this.q.field('vw_country.title', 'country_of_origin_title');
		this.q.field('category_text.title', 'default_category_title');

		this.q.from('vw_inventory_item', 'vw');

		this.q.left_join('product_text', null, 'product_text.product_id = vw.product_id and vw.lang_id = product_text.lang_id');
		this.q.left_join('manufacturer_text', null, 'manufacturer_text.manufacturer_id = (vw.product ->> \'manufacturer_id\')::INT and vw.lang_id = manufacturer_text.lang_id');
		this.q.left_join('product_prop', null, 'product_prop.product_id = vw.product_id');
		this.q.left_join('vw_country', null, 'product_prop.country_of_origin = vw_country.country_id and vw_country.lang_id = vw.lang_id');
		this.q.left_join('category_text', null, 'category_text.category_id = (vw.product ->> \'default_category_id\')::INT and vw.lang_id = category_text.lang_id');
		this.q.left_join(
			`(
				select
					item_id,
					json_object_agg(concat(location_id, '-', supply_id), available_qty) as stock
				from
					inventory_stock
				group by
					item_id
			)`,
			'stock_by_location',
			'stock_by_location.item_id = vw.item_id'
		);
		this.q.left_join(
			`(
				select
					final_price.item_id,
					coalesce(final_price.min, final_price.value) as price
				from
					final_price
					inner join price using(price_id)
				where
					point_id = ${escapedPointId}
					and price.alias = 'selling_price'
			)`,
			'selling_price',
			'selling_price.item_id = vw.item_id'
		);
		this.q.where('vw.status != \'draft\'');
		this.compareRmStatus('vw.deleted_at');

		this.q.where('vw.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('vw.type in (\'product\', \'variant\')');

		this.compare('vw.product ->> \'manufacturer_id\'', manufacturer_id);
		this.compare('vw.product ->> \'group_id\'', group_id);
		this.compare('vw.product_id', product_id);
		this.compare('vw.status', status);

		if (['0', '1'].indexOf(has_variants) != -1) {
			const val = has_variants == '1' ? 'true' : 'false';
			this.q.where(`(vw.product -> 'has_variants')::TEXT::BOOLEAN is ${val}`);
		}

		if (category_id) {
			this.q.where(`
				exists (
					select
						1
					from
						product_category_rel
					where
						category_id = ?
						and product_category_rel.product_id = vw.product_id
				)
			`, category_id);
		}

		if (label_id) {
			this.q.where(`
				exists (
					select
						1
					from
						product_label_rel
					where
						label_id = ?
						and product_label_rel.product_id = vw.product_id
				)
			`, label_id);
		}

		if (collection_id) {
			this.q.where(`
				exists (
					select
						1
					from
						collection_product_rel
					where
						collection_id = ?
						and collection_product_rel.product_id = vw.product_id
				)
			`, collection_id);
		}

		this.compareNumber('vw.available_qty', available_qty);
		this.compareNumber('selling_price.price', price);

		if (stock) {
			switch (stock) {
				case 'in_stock':
					this.q.where('vw.available_qty > 0 or vw.track_inventory is false');
					break;
				case 'out_stock':
					this.q.where('vw.available_qty = 0');
					break;
				case 'not_tracked':
					this.q.where('vw.track_inventory is false');
					break;
			}
		}

		if (product && validator.trim(product) != '') {
			const _product = validator.trim(product).toLowerCase();

			let id = parseInt(_product);
			id = isNaN(id) ? 0 : id;

			this.q.where(`
				vw.product_id = ?
				or lower(vw.product ->> 'sku') like ?
				or lower(vw.product ->> 'title') like ?
				or lower(vw.product ->> 'url_key') like ?
				or product_text.description like ?`,
				id, `%${_product}%`, `%${_product}%`, `%${_product}%`, `%${_product}%`
			);
		}

		if (import_log_id) {
			this.q.where(`
				exists (
					select
						1
					from
						product_import_rel
					where
						log_id = ?
						and product_import_rel.product_id = vw.product_id
				)
			`, import_log_id);
		}
	}

	sortRules() {
		return {
			default: [{product: 'asc'}],
			attrs: {
				product: 'vw.product ->> \'title\'',
				price: 'selling_price.price',
				stock: 'vw.available_qty',
				product_id: 'vw.product_id',
				created_at: 'vw.product_id',
			}
		};
	}

	async prepareData(rows) {
		let out = [];

		for (let row of rows) {
			let outRow = _.omit(row, ['stock_by_location']);

			outRow.stock = this.prepareStockByLocation(row.stock_by_location || {});
			outRow.prices = sqlAggArr2Objects(row.prices);

			out.push(outRow);
		}

		return [this.getMetaResult(), out];
	}

	async getTplData() {
		const data = await super.getTplData();

		return Object.assign(data, {
			locations: this.locations,
			prices: this.prices
		});
	}

	createCalcRowsQuery() {
		let calcRowsQuery = this.q.clone();
		calcRowsQuery.resetFields();
		calcRowsQuery.resetOrder();
		calcRowsQuery.field('count(distinct vw.item_id) as total_rows');

		return calcRowsQuery;
	}

	prepareStockByLocation(stock) {
		let out = {};

		Object.keys(stock).forEach((key) => {
			let locationParts = key.split('-');

			if (locationParts[0]) {
				let locationId = parseInt(locationParts[0]);

				if (!(locationId in out)) {
					out[locationId] = 0;
				}

				out[locationId] += stock[key];
			}
		});

		return out;
	}
}