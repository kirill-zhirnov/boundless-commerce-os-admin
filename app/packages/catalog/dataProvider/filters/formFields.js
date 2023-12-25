import DataProvider from '../../../../modules/dataProvider/index';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';
import _ from 'underscore';
import validator from '../../../../modules/validator/validator';

const multiCaseCharacteristics = ['radio', 'checkbox', 'select'];

/**
 * How to use:
 * this.getFilters()
 */
export default class FilterFormFields extends DataProvider {
	constructor(...args) {
		super(...args);

		this.attrsInited = false;
		this.filters = null;
		this.filterValues = null;
	}

	getRules() {
		return [
			['categoryId, filterId', 'required'],
			['categoryId, filterId', 'isNum', {min: 1, no_symbols: true}],
			['values', 'safe']
		];
	}

	async getFilters() {
		if (!await this.initAttrs()) {
			return;
		}

		await this.loadFilters();
		await this.loadFiltersContent();

		return this.filters;
	}

	async preSearch() {
		if (!await this.initAttrs()) {
			return;
		}

		if (!this.filters) {
			await this.loadFilters();
			await this.loadFiltersContent();
		}

		let select = this.getProductCalcSelect();
		this.applyFiltersToProductCalc(select);

		select.field('count(*) as total');

		let rows = await this.getDb().execSquel(select);

		return {
			total: rows[0].total,
			filters: this.filters
		};
	}

	/**
	 * e.g. load min/max for price, brands, etc
	 *
	 * @returns {Promise<void>}
	 */
	async loadFiltersContent() {
		for (const filter of this.filters) {
			switch (filter.type) {
				case 'price':
					await this.loadPriceContent(filter);
					break;
				case 'brand':
					await this.loadBrandContent(filter);
					break;
				// case 'availability':
				// 	await this.loadAvailabilityContent(filter);
				// 	break;
				case 'characteristic':
					if (multiCaseCharacteristics.includes(filter.subType)) {
						await this.loadMultiValCharactContent(filter);
					}
					break;
			}
		}
	}

	async initAttrs() {
		if (this.attrsInited)
			return true;

		try {
			await this.validate();
			this.attrsInited = true;

			return true;
		} catch (err) {
			if (err instanceof Error) {
				throw err;
			} else {
				if (wrapperRegistry.isDebug()) {
					console.error('\n\nData provider validation errors:', this.getErrors());
				}

				this.controller.rejectHttpError(400, 'Incorrect input params');

				return false;
			}
		}
	}

	getBasicFiltersSelect() {
		let langId = this.getDb().escape(this.getLang().lang_id);
		let select = this.getDb().squel().select();

		select.field('filter_field.field_id');
		select.field('filter_field.type');
		select.field('filter_field.characteristic_id');
		select.field('vw.title', 'characteristic_title');
		select.field('vw.help', 'help');
		select.field('vw.type', 'characteristic_type');
		select.field('cCase.case_id', 'characteristic_case_id');
		select.field('caseText.title', 'characteristic_case_title');

		select.from('filter_field');
		select.left_join(
			'vw_characteristic_grid',
			'vw',
			`vw.characteristic_id = filter_field.characteristic_id and vw.lang_id = ${langId}`
		);
		select.left_join(
			'characteristic_type_case',
			'cCase',
			`cCase.characteristic_id = vw.characteristic_id and vw.type in (${this.getDb().escapeIn(multiCaseCharacteristics)})`
		);
		select.left_join(
			'characteristic_type_case_text',
			'caseText',
			`cCase.case_id = caseText.case_id and caseText.lang_id = ${langId}`
		);

		select.where('filter_field.filter_id = ?', this.getSafeAttr('filterId'));

		select.order('filter_field.sort asc, cCase.sort asc', null);

		return select;
	}

	getFiltersSelect() {
		let select = this.getBasicFiltersSelect();
		select.where('filter_field.type != ?', 'category');

		return select;
	}

	async loadFilters() {
		let rows = await this.getDb().execSquel(this.getFiltersSelect());

		this.filters = [];
		this.filterValues = [];

		for (const row of rows) {
			let filter;

			switch (row.type) {
				case 'characteristic':
					if (multiCaseCharacteristics.includes(row.characteristic_type)) {
						filter = this.filters.find((filterRow) => filterRow.field_id == row.field_id);
						if (!filter) {
							filter = {
								field_id: row.field_id,
								type: row.type,
								characteristic_id: row.characteristic_id,
								subType: row.characteristic_type,
								title: row.characteristic_title,
								name: `field_${row.field_id}`,
								value: [],
								options: [],
								isCaseBased: true
							};

							this.filters.push(filter);
							this.setupFilterValue(filter);
						}
						filter.options.push([row.characteristic_case_id, row.characteristic_case_title]);
					} else {
						filter = {
							field_id: row.field_id,
							type: row.type,
							characteristic_id: row.characteristic_id,
							subType: row.characteristic_type,
							title: row.characteristic_title,
							name: `field_${row.field_id}`,
							value: '',
							isTextBased: true
						};

						this.filters.push(filter);
						this.setupFilterValue(filter);
					}
					break;
				default:
					filter = {
						field_id: row.field_id,
						type: row.type
					};

					if (row.type == 'brand') {
						filter.name = 'brand';
					} else if (row.type == 'availability') {
						filter.name = 'available';
					} else if (row.type == 'category') {
						filter.name = 'category';
					}

					this.setupFilterValue(filter);
					this.filters.push(filter);

					break;
			}
		}

		return this.filters;
	}

	setupFilterValue(filter) {
		let values = this.getSafeAttr('values');

		if (!values || !_.isObject(values))
			return;

		switch (filter.type) {
			case 'price':
				filter.value = {};

				['price_min', 'price_max'].forEach((field) => {
					if (field in values) {
						let value = values[field] * 1;
						if (!isNaN(value) && value > 0) {
							filter.value[field] = value;
						}
					}
				});

				if (Object.keys(filter.value).length) {
					this.filterValues.push({
						name: 'price',
						type: filter.type,
						value: filter.value
					});
				}

				break;

			case 'brand':
				filter.value = [];
				if (Array.isArray(values.brand)) {
					values.brand.forEach((brandId) => {
						if (validator.isNumeric(brandId, {no_symbols: true})) {
							brandId = parseInt(brandId);

							if (brandId && brandId > 0) {
								filter.value.push(brandId);
							}
						}
					});

					if (filter.value.length) {
						this.filterValues.push({
							name: 'brand',
							type: filter.type,
							value: filter.value
						});
					}
				}

				break;

			case 'availability':
				if ('available' in values && ['1', 'true'].includes(String(values.available))) {
					filter.value = '1';

					this.filterValues.push({
						name: 'available',
						type: filter.type,
						value: filter.value
					});
				}
				break;

			case 'category':
				if (filter.name in values) {
					let categoryId = values[filter.name];

					if (validator.isNumeric(categoryId, {no_symbols: true})) {
						categoryId = parseInt(categoryId);

						if (categoryId && categoryId > 0) {
							filter.value = categoryId;

							this.filterValues.push({
								name: filter.name,
								type: filter.type,
								value: filter.value
							});
						}
					}
				}
				break;
			case 'characteristic':
				if (multiCaseCharacteristics.includes(filter.subType)) {
					if (Array.isArray(values[filter.name])) {
						let validValues = [];

						values[filter.name].forEach((caseId) => {
							if (validator.isNumeric(caseId, {no_symbols: true})) {
								caseId = parseInt(caseId);

								if (caseId && caseId > 0) {
									validValues.push(caseId);
								}
							}
						});

						if (validValues.length) {
							filter.value = validValues;

							this.filterValues.push({
								name: filter.name,
								type: filter.type,
								subType: filter.subType,
								characteristic_id: filter.characteristic_id,
								value: filter.value
							});
						}
					}
				} else {
					if (filter.name in values) {
						let validValue = validator.trim(values[filter.name]);

						if (validValue != '') {
							filter.value = validValue;

							this.filterValues.push({
								name: filter.name,
								type: filter.type,
								subType: filter.subType,
								characteristic_id: filter.characteristic_id,
								value: filter.value
							});
						}
					}
				}
				break;
		}
	}

	async loadPriceContent(filter) {
		let {min, max} = await this.countPriceRange();

		filter.range = {
			min,
			max
		};

		return filter;
	}

	async loadAvailabilityContent(filter) {
		let select = this.getProductCalcSelect();
		this.applyFiltersToProductCalc(select, ['available']);

		select
			.field('count(*)', 'available_qty')
			.where(`
				(
					(pg.not_track_inventory is null or pg.not_track_inventory is false)
					and product_prop.available_qty > 0
				)
				or
				(pg.not_track_inventory is true)
			`);


		let rows = await this.getDb().execSquel(select);
		filter.qty = rows[0].available_qty;
	}

	async loadBrandContent(filter) {
		let options = await this.getModel('manufacturer').findOptions(
			this.getLang().lang_id
		);

		let productsQtyByBrand = await this.calcProductsByBrand();
		for (let option of options) {
			let props = {qty: 0};
			if (option[0] in productsQtyByBrand) {
				props.qty = productsQtyByBrand[option[0]];
			}

			option.push(props);
		}

		filter.options = options;
	}

	async loadMultiValCharactContent(filter) {
		let productsByCase = await this.calcProductsByCharactCase(filter);

		filter.options.forEach((row) => {
			let props = {qty: 0};
			if (row[0] in productsByCase) {
				props.qty = productsByCase[row[0]];
			}

			row.push(props);
		});
	}

	async calcProductsByCharactCase(filter) {
		let select = this.getProductCalcSelect();
		this.applyFiltersToProductCalc(select, [filter.name]);

		select
			.field('characteristic_product_val.case_id')
			.field('count(*)', 'products_qty')
			.join('characteristic_product_val', null, 'characteristic_product_val.product_id = product.product_id')
			.where('characteristic_product_val.characteristic_id = ?', filter.characteristic_id)
			.where('characteristic_product_val.case_id is not null')
			.group('characteristic_product_val.case_id')
		;

		let rows = await this.getDb().execSquel(select),
			out = {}
		;

		for (let row of rows) {
			out[row.case_id] = row.products_qty;
		}

		return out;
	}

	async calcProductsByBrand() {
		let select = this.getProductCalcSelect();
		this.applyFiltersToProductCalc(select, ['brand']);

		select
			.field('manufacturer_id')
			.field('count(*)', 'products_qty')
			.where('manufacturer_id is not null')
			.group('manufacturer_id')
		;

		let rows = await this.getDb().execSquel(select),
			out = {}
		;

		for (let row of rows) {
			out[row.manufacturer_id] = row.products_qty;
		}

		return out;
	}

	async countPriceRange() {
		let select = this.getProductCalcSelect();
		this.applyFiltersToProductCalc(select, ['price']);

		select
			.field('min(value)', 'min')
			.field('min(min)', 'min_min')
			.field('max(value)', 'max')
			.field('max(max)', 'max_max')
		;

		let rows = await this.getDb().execSquel(select),
			row = rows[0]
		;

		let minValues = [];
		if (row.min !== null)
			minValues.push(row.min);
		if (row.min_min !== null)
			minValues.push(row.min_min);

		let maxValues = [];
		if (row.max !== null)
			maxValues.push(row.max);
		if (row.max_max !== null)
			maxValues.push(row.max_max);

		let min = Math.min.apply(Math, minValues),
			max = Math.max.apply(Math, maxValues)
		;

		return {min, max};
	}

	getBasicProductCalc() {
		let select = this.getDb().squel().select()
			.from('product')
			.join('product_prop', null, 'product.product_id = product_prop.product_id')
			.left_join('inventory_item', 'i', 'product.product_id = i.product_id')
			.left_join('final_price', 'fp', 'fp.item_id = i.item_id')
			.left_join('point_sale', 'ps', 'ps.point_id = fp.point_id')
			.left_join('price', 'price', 'price.price_id = fp.price_id')
			.left_join('commodity_group', 'pg', 'pg.group_id = product.group_id')
			.where('ps.site_id = ? or fp.point_id is null', this.getSite().site_id)
			.where('price.alias = ? or fp.point_id is null', 'selling_price')
			.where('product.status = \'published\' and product.deleted_at is null')
		;

		return select;
	}

	getProductCalcSelect() {
		let select = this.getBasicProductCalc();

		select
			.join('product_category_rel', null, 'product_category_rel.product_id = product.product_id')
			.where('product_category_rel.category_id = ?', this.getSafeAttr('categoryId'))
		;

		return select;
	}

	applyFiltersToProductCalc(select, skipFilters = []) {
		let characteristicTextVals = [];

		for (const filter of this.filterValues) {
			if (skipFilters.includes(filter.name)) {
				continue;
			}

			switch (filter.type) {
				case 'price':
					if (filter.value.price_min) {
						select.where('fp.value >= ? or fp.min >= ? or fp.max >= ?', filter.value.price_min, filter.value.price_min, filter.value.price_min);
					}

					if (filter.value.price_max) {
						select.where('fp.value <= ? or fp.max <= ?', filter.value.price_max, filter.value.price_max);
					}
					break;

				//filter is only for ManufacturerFormFields class, so we need to join category_rel:
				case 'category':
					if (filter.value) {
						select
							.join('product_category_rel', null, 'product_category_rel.product_id = product.product_id')
							.where('product_category_rel.category_id = ?', filter.value)
						;
					}
					break;

				case 'brand':
					if (filter.value.length) {
						select.where('product.manufacturer_id in ?', filter.value);
					}
					break;

				case 'availability':
					if (filter.value == '1') {
						select.where(`
							((pg.not_track_inventory is null or pg.not_track_inventory is false) and product_prop.available_qty > 0)
							or
							(pg.not_track_inventory is true)
						`);
					}
					break;

				case 'characteristic':
					if (multiCaseCharacteristics.includes(filter.subType)) {
						if (filter.value.length) {
							let sqlPart = [];

							filter.value.forEach((caseId) => {
								//caseId can be Int only
								sqlPart.push(`product_prop.characteristic->'${filter.characteristic_id}' @> '${caseId}'`);
							});

							select.where(sqlPart.join(' or '));
						}
					} else {
						if (filter.value != '') {
							characteristicTextVals.push(filter.value);
						}
					}
					break;
			}
		}

		if (characteristicTextVals.length) {
			let textParams = [this.getLang().lang_id],
				textSql = []
			;

			characteristicTextVals.forEach((row) => {
				textSql.push('characteristic_product_val_text.value like ?');
				textParams.push(`%${row}%`);
			});

			textParams.unshift(`product.product_id in (
				select
					product_id
				from
					characteristic_product_val
					inner join characteristic_product_val_text using(value_id)
				where
					lang_id = ?
					and (${textSql.join(' or ')})
			)`);

			select.where.apply(select, textParams);
		}
	}

	getData() {
		throw new Error('Use getFilters or preSearch instead.');
	}
}
