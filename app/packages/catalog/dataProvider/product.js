import DataProvider from '../../../modules/dataProvider/index';
import _ from 'underscore';
import validator from '../../../modules/validator/validator';

const multiCaseCharacteristics = ['radio', 'checkbox', 'select'];

export default class ProductDataProvider extends DataProvider {
	constructor(options) {
		super(options);

		//@category - int - id of category or array of ids
		//@filter - id of filter
		// ({category: this.category, filter: this.filter} = options);
		this.filter = options.filter;
		this.category = options.category;

		this.filterFields = [];
		this.filterValues = {};

		this.sort = null;
		this.trackInventory = null;
		this.imgProportion = null;

		this.characteristicValJoined = false;

		this.validPageSize = [4];
		this.defaults.perPage = 4;

		this.distinctOn = 'select distinct on(p.product_id, rel.sort, pt.title, is_available, sort_price, p.created_at) ';
	}

	async setup() {
		const settings = this.getInstanceRegistry().getSettings();

		await super.setup();

		const categorySettings = await settings.get('catalog', 'category');
		this.trackInventory = await settings.get('inventory', 'trackInventory');
		this.imgProportion = await settings.get('system', 'imgProportion');

		this.sort = categorySettings.sort;
		if (!_.isArray(this.sort)) {
			this.sort = [];
		}

		this.setPerPage(categorySettings.limit);

		if (this.filter) {
			return this.setupFilters();
		}
	}

	getRules() {
		return super.getRules().concat([
			['category', 'validateCategory']
		]);
	}

	createQuery() {
		this.createBaseQuery();

		this.q.field('category.category_id');
		this.q.join('product_category_rel', 'rel', 'rel.product_id = p.product_id');
		this.q.join('category', null, 'category.category_id = rel.category_id and category.deleted_at is null');

		this.q.where(`rel.category_id in (${this.getDb().escapeIn(this.category)})`);
		this.q.where('p.status = \'published\' and p.deleted_at is null');

		return this.applyFilters();
	}

	createBaseQuery() {
		const langId = this.getDb().escape(this.getLang().lang_id);

		this.q.field('p.product_id');
		this.q.field('p.sku');
		this.q.field('pt.title');
		this.q.field('pt.url_key');
		this.q.field('img.path', 'img_path');
		this.q.field('img.width', 'img_width');
		this.q.field('img.height', 'img_height');
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
		this.q.field('i.item_id');
		this.q.field('defCatRel.category_id', 'default_category_id');
		this.q.field(`case when
((pg.not_track_inventory is null or pg.not_track_inventory is false) and pp.available_qty > 0) or (pg.not_track_inventory is true) then 1
else 0 end`, 'is_available');
		this.q.field('manufacturer_text.title', 'manufacturer_title');

		this.q.from('product', 'p');
		this.q.join('product_text', 'pt', 'pt.product_id = p.product_id');
		this.q.join('inventory_item', 'i', 'p.product_id = i.product_id');
		this.q.join('product_prop', 'pp', 'p.product_id = pp.product_id');
		this.q.left_join('manufacturer', null, 'p.manufacturer_id = manufacturer.manufacturer_id and manufacturer.deleted_at is null');
		this.q.left_join(
			'manufacturer_text',
			null,
			`manufacturer_text.manufacturer_id = manufacturer.manufacturer_id and manufacturer_text.lang_id = ${langId}`
		);

		this.q.left_join('final_price', 'fp', 'fp.item_id = i.item_id');
		this.q.left_join('point_sale', 'ps', 'ps.point_id = fp.point_id');
		this.q.left_join('price', 'price', 'price.price_id = fp.price_id');
		this.q.left_join('commodity_group', 'pg', 'pg.group_id = p.group_id');

		this.q.left_join('product_image', 'pi', 'pi.product_id = p.product_id and pi.is_default is true');
		this.q.left_join('image', 'img', 'img.image_id = pi.image_id');
		this.q.left_join('product_category_rel', 'defCatRel', 'defCatRel.product_id = p.product_id and defCatRel.is_default is true');

		this.q.where('pt.lang_id = ?', this.getLang().lang_id);
		this.q.where('ps.site_id = ? or fp.point_id is null', this.getSite().site_id);
		this.q.where('price.alias = ? or fp.point_id is null', 'selling_price');
	}

	applyFilters() {
		const characteristicTextVals = [];

		for (const filter of Array.from(this.filterFields)) {
			switch (filter.type) {
				case 'brand':
					if (filter.value.length) {
						this.q.where('p.manufacturer_id in ?', filter.value);
					}
					break;

				case 'price':
					if (filter.value.price_min) {
						this.q.where('fp.value >= ? or fp.min >= ? or fp.max >= ?', filter.value.price_min, filter.value.price_min, filter.value.price_min);
					}

					if (filter.value.price_max) {
						this.q.where('fp.value <= ? or fp.max <= ?', filter.value.price_max, filter.value.price_max);
					}
					break;

				case 'availability':
					if (filter.value === '1') {
						this.q.where('\
((pg.not_track_inventory is null or pg.not_track_inventory is false) and pp.available_qty > 0) \
or \
(pg.not_track_inventory is true)\
'
						);
					}
					break;

				case 'characteristic':
					if (multiCaseCharacteristics.includes(filter.characteristic_type)) {
						if (filter.value.length) {
							var sqlPart = [];
							filter.value.forEach(caseId => // caseId can be Int only
								sqlPart.push(`pp.characteristic->'${filter.characteristic_id}' @> '${caseId}'`));

							this.q.where(sqlPart.join(' or '));
						}
					} else {
						if (filter.value !== '') {
							characteristicTextVals.push(filter.value);
						}
					}
					break;
			}
		}

		if (characteristicTextVals.length) {
			const textParams = [this.getLang().lang_id];
			const textSql = [];

			characteristicTextVals.forEach(function (row) {
				textSql.push('characteristic_product_val_text.value like ?');
				//@ts-ignore
				return textParams.push(`%${row}%`);
			});

			//@ts-ignore
			textParams.unshift(`p.product_id in ( \
select \
product_id \
from \
characteristic_product_val \
inner join characteristic_product_val_text using(value_id) \
where \
lang_id = ? \
and (${textSql.join(' or ')}) \
)`
			);

			return this.q.where.apply(this.q, textParams);
		}
	}

	getSortBySettings() {
		const orderSql = this.getBasicSortRules();

		for (let item of Array.from(this.sort)) {
			switch (item.type) {
				case 'price':
					orderSql.push(`sort_price ${item.mode}`);
					break;

				case 'availability':
					var mode = item.mode === 'asc' ? 'desc' : 'asc';
					orderSql.push(`is_available ${mode}`);
					break;

				case 'name':
					orderSql.push(`pt.title ${item.mode}`);
					break;

				case 'created_at':
					orderSql.push(`p.created_at ${item.mode}`);
					break;
			}
		}

		if (orderSql.length > 0) {
			return orderSql.join(',');
		}

		return false;
	}

	getBasicSortRules() {
		return ['rel.sort asc nulls last'];
	}

	sortRules() {
		const sortBySettings = this.getSortBySettings();

		const out = {
			default: [{price: 'asc'}],
			attrs: {
				price: 'sort_price',
				//				By stock has only one option - in stock should be first, so
				//				always "desc"
				stock: {
					asc: 'is_available desc',
					desc: 'is_available desc'
				}
			}
		};

		if (sortBySettings) {
			out.attrs.sortBySettings = {
				asc: sortBySettings,
				desc: sortBySettings,
			};
			//@ts-ignore
			out.default = [{sortBySettings: 'asc'}];
		}

		return out;
	}

	async prepareData(rows) {
		let row;
		const ProductModel = this.getModel('product');

		//		filterAttrs = {}
		const filterAttrs = this.filterValues;

		const productIds = [];
		for (let i = 0; i < rows.length; i++) {
			row = rows[i];
			//@ts-ignore
			ProductModel.prepareRow(row, this.trackInventory, this.imgProportion, this.getInstanceRegistry());

			const urlParams =
				{id: row.url_key ? row.url_key : row.product_id};

			if (row.category_id && (row.category_id !== row.default_category_id)) {
				urlParams.category = row.category_id;
			}

			row.url = this.url('@product', _.extend(urlParams, filterAttrs));

			rows[i] = row;
			productIds.push(row['product_id']);
		}

		//@ts-ignore
		const labels = await this.getDb().model('label').findLabelsByProducts(productIds, this.getLang().lang_id);
		for (row of Array.from(rows)) {
			row.labels = labels[row.product_id] || [];
		}

		return [
			this.getMetaResult(),
			rows,
			{
				imgProportion: this.imgProportion
			}
		];

	}

	async createSql() {
		const sql = await super.createSql();
		sql.text = sql.text.replace(/^select/i, this.distinctOn);

		return sql;
	}

	createCalcRowsQuery() {
		const calcRowsQuery = this.q.clone();
		calcRowsQuery.resetFields();
		calcRowsQuery.resetOrder();
		calcRowsQuery.field('count(distinct p.product_id) as total_rows');

		return calcRowsQuery;
	}

	validateCategory() {
		if (!Array.isArray(this.category)) {
			this.addError('category', 'notArray', 'Category is not an array!');
			return;
		}

		const validCategories = [];
		this.category.forEach(categoryId => {
			categoryId = parseInt(categoryId);

			if (!isNaN(categoryId)) {
				return validCategories.push(categoryId);
			}
		});

		if (!validCategories.length) {
			this.addError('category', 'noValidCategories', 'Category is empty');
			return;
		}

		this.category = validCategories;

		return true;
	}

	async setupFilters() {
		const rows = await this.getDb().sql('\
select \
field_id, \
filter_field.type, \
characteristic_id, \
characteristic.type as characteristic_type \
from \
filter_field \
left join characteristic using(characteristic_id) \
where \
filter_id = :filter \
order by \
filter_field.sort asc\
', {
			filter: this.filter
		});

		//@ts-ignore
		const queryAttrs = this.getFrontController().getQuery();

		this.filterFields = [];
		this.filterValues = {};
		rows.forEach(row => {
			let filter = row;
			//@ts-ignore
			switch (filter.type) {
				case 'price':
					//@ts-ignore
					filter.value = {};
					['price_min', 'price_max'].forEach(field => {
						if (queryAttrs[field]) {
							const value = Number(queryAttrs[field]);
							if (!isNaN(value) && (value > 0)) {
								this.filterValues[field] = value;
								//@ts-ignore
								return filter.value[field] = value;
							}
						}
					});
					break;

				case 'brand':
					//@ts-ignore
					filter.value = [];
					if (Array.isArray(queryAttrs.brand)) {
						const brands = [];
						queryAttrs.brand.forEach(function (brandId) {
							if (validator.isNumeric(brandId, {no_symbols: true})) {
								brandId = parseInt(brandId);

								if (brandId && (brandId > 0)) {
									return brands.push(brandId);
								}
							}
						});

						if (brands.length) {
							//@ts-ignore
							filter.value = brands;
							this.filterValues.brand = brands;
						}
					}
					break;

				case 'availability':
					if (('available' in queryAttrs) && ['1', 'true'].includes(String(queryAttrs.available))) {
						//@ts-ignore
						filter.value = '1';
						this.filterValues.available = '1';
					}
					break;

				case 'characteristic':
					//@ts-ignore
					filter.name = `field_${row.field_id}`;
					//@ts-ignore
					if (multiCaseCharacteristics.includes(row.characteristic_type)) {
						//@ts-ignore
						filter.value = [];

						//@ts-ignore
						if (Array.isArray(queryAttrs[filter.name])) {
							const validValues = [];
							//@ts-ignore
							queryAttrs[filter.name].forEach(caseId => {
								if (validator.isNumeric(caseId, {no_symbols: true})) {
									caseId = parseInt(caseId);

									if (caseId && (caseId > 0)) {
										return validValues.push(caseId);
									}
								}
							});

							if (validValues.length) {
								//@ts-ignore
								filter.value = validValues;
								//@ts-ignore
								this.filterValues[filter.name] = validValues;
							}
						}
					} else {
						//@ts-ignore
						filter.value = '';

						//@ts-ignore
						if (filter.name in queryAttrs) {
							//@ts-ignore
							const validValue = validator.trim(queryAttrs[filter.name]);

							if (validValue !== '') {
								//@ts-ignore
								filter.value = validValue;
								//@ts-ignore
								this.filterValues[filter.name] = validValue;
							}
						}
					}
					break;

				case 'category':
					//						Filter needs for manufacturer's page:
					//@ts-ignore
					filter = this.prepareCategoryFilter(filter, queryAttrs);
					break;
			}

			if (filter) {
				return this.filterFields.push(filter);
			}
		});

	}

	prepareCategoryFilter(filter, queryAttrs) {
		return false;
	}

	getFilterValues() {
		return this.filterValues;
	}
}