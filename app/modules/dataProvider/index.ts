import BasicForm, {IFormOptions, IOptionsList, TFormRules} from '../form';
import {wrapperRegistry} from '../registry/server/classes/wrapper';
import squel from '../db/squel';
import squelOriginal from 'squel';
import _ from 'underscore';
import validator from '../validator/validator';
import errors from '../errors/errors';
import dateExtended from 'date-extended';
import {IDataProviderMetaResult} from '../../@types/dataProvider';

export interface IDataProviderDefaults {
	rmStatus: number;
	perPage: number | boolean;
	[key: string]: any;
}

export default class BasicDataProvider<IRow = {[key: string]: any}, Attributes = {}> extends BasicForm<IDataProviderDefaults> {
	protected defaults: IDataProviderDefaults = {
		rmStatus: 0,
		perPage: 25
	};
	protected filterRegExp: RegExp = /^(<|>)?(.+)$/;
	protected validPageSize: (number | boolean)[] = [25, 50, 100, 500];
	protected q: squelOriginal.Select;
	protected totalRows: number;

	constructor(options: IFormOptions) {
		super(options);

		this.scenario = 'search';
	}

	getRules(): TFormRules {
		return [
			['perPage', 'validatePerPage'],
			['page', 'validatePage'],
			['sortBy', 'validateSortBy'],
			['order', 'validateOrder'],

			//			remStatus can be 0 or 1. 0 - not removed, 1 - removed.
			['rmStatus', 'validateRmStatus']
		];
	}

	async setup() {
		this.safeAttrs = this.defaults;
	}

	async getData(): Promise<any[]> {
		try {
			await this.validate();
			const sql = await this.createSql();
			const rows = await this.makeSqlRequest(sql);
			const data = await this.prepareData(rows);

			return data;
		} catch (e) {
			if (e instanceof Error)
				throw e;

			if (wrapperRegistry.isDebug()) {
				console.error('\n\nData provider validation errors:', this.getErrors());
			}

			throw new errors.HttpError(400, 'Incorrect input params');
		}
	}

	async createSql() {
		this.q = this.squelSelect();

		const perPage = this.getPageSize();
		await this.createQuery();

		if (perPage !== false) {
			await this.calcTotalRows();
		}

		const sql = this.getSortSql();
		if (sql) {
			this.q.order(sql, null);
		}

		if (perPage !== false) {
			const limit = this.getLimit();
			this.q.offset(limit.offset);
			this.q.limit(limit.limit);
		}

		return this.q.toParam();
	}

	createQuery() {
		throw new Error('You must redefine \'createSql\' method.');
	}

	async makeSqlRequest(sql) {
		return this.getDb().sql<IRow>(sql.text, sql.values);
	}

	prepareData(rows): TPreparedData | Promise<TPreparedData> | any {
		return [this.getMetaResult(), rows];
	}

	/**
//	Specify sort rules for your data provider:
//	{
//		default : [{field1 : 'asc'}]
//		attrs :
//			field1 : 't.field_in_table'
//			field2 :
//				asc : 't.field2 asc, t.another_field desc'
//				desc : 't.field2 desc, t.another_field asc'
// 	}
//
//	In default - array should have lenght = 1
//	In attrs - specify attributes. If attribute specified as string - ASC/DESC will be added.
	 */
	sortRules() {
		return {
			default: null,
			attrs: {}
		};
	}

	async calcTotalRows() {
		const calcRowsQuery = this.createCalcRowsQuery();

		const sql = calcRowsQuery.toParam();
		const rows = await this.getDb().sql(sql.text, sql.values);
		//@ts-ignore
		this.totalRows = parseInt(rows[0].total_rows);
	}

	createCalcRowsQuery() {
		const calcRowsQuery = this.q.clone();
		calcRowsQuery.resetFields();
		calcRowsQuery.resetOrder();
		calcRowsQuery.field('count(*) as total_rows');

		return calcRowsQuery;
	}

	squelSelect(): squelOriginal.Select {
		return squel.select();
	}

	getSortSql() {
		const sortBy = this.getSortBy();

		if (!sortBy) {
			return null;
		}

		const sortRules = this.sortRules();
		const sortDirection = this.getSortDirection();

		const field = sortRules.attrs[sortBy];
		if (_.isString(field)) {
			return `${field} ${sortDirection}`;
		} else {
			if (!_.isObject(field) || !(sortDirection in field))
				throw new Error(`Rule for '${sortBy}' should be string or an object with keys: 'asc' and 'desc'`);

			return field[sortDirection];
		}
	}

	getLimit() {
		let page = this.getPage();
		const perPage = this.getPageSize();
		let offset = 0;

		//		check maxPage:
		if (perPage !== false) {
			const maxPage = Math.ceil(this.totalRows / perPage);
			if (page > maxPage) {
				page = 1;
				this.setPage(page);
			}

			offset = (page - 1) * perPage;
		}

		return {
			limit: perPage,
			offset
		};
	}

	getSortBy() {
		return this.getSafeAttr('sortBy');
	}

	getSortDirection() {
		return this.getSafeAttr('order');
	}

	getPage(): number {
		return this.getSafeAttr('page') as unknown as number;
	}

	setPage(page) {
		page = parseInt(page);

		if (!page) {
			page = 1;
		}

		this.setSafeAttr('page', page);

		return this;
	}

	setPerPage(perPage: number | string) {
		perPage = parseInt(perPage as unknown as string);

		if (this.validPageSize.indexOf(perPage) === -1) {
			this.validPageSize.push(perPage);
		}

		this.defaults.perPage = perPage;

		return this;
	}

	parseDate4Filter(ts) {
		const res = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(ts);
		if (res) {
			const start = new Date(Number(res[3]), (Number(res[2]) - 1), Number(res[1]));
			const end = dateExtended.add(start, 'day', 1);

			return [start, end];
		}

		return false;
	}

	getPageSize() {
		return this.getSafeAttr('perPage');
	}

	getMetaResult(): IDataProviderMetaResult {
		const out: IDataProviderMetaResult = {
			totalEntries: this.totalRows,
			perPage: parseInt(this.getPageSize()),
			page: this.getPage()
		};

		const sortBy = this.getSortBy();
		if (sortBy) {
			out.sortBy = sortBy;
			out.order = this.getSortDirection();
		}

		return out;
	}

	rawOptions(): IOptionsList|Promise<IOptionsList> {
		return {
			rmStatus: [
				['0', this.__('Active')],
				['1', this.__('Removed')]
			]
		};
	}

	getDefault(field, defaultVal = null) {
		if (field in this.defaults) {
			return this.defaults[field];
		}

		return defaultVal;
	}

	turnOffPagination() {
		this.validPageSize = [false];
		this.setSafeAttr('perPage', false);

		//@ts-ignore
		this.attributes.perPage = false;

		return this;
	}

	compare(column: string, value: null | (string | number)[] | string, partialMatch = false) {
		if ((value !== undefined) && (value !== '')) {
			if (value === null) {
				this.q.where(`${column} is null`);
			} else if (_.isArray(value)) {
				this.q.where(`${column} in ?`, value);
			} else if (partialMatch) {
				this.q.where(`${column} like ?`, `%${value}%`);
			} else {
				const result = String(value).match(this.filterRegExp);

				const searchValue = validator.trim(result[2]);
				const operator = result[1];

				switch (operator) {
					case '>':
						this.q.where(`${column} >= ?`, searchValue);
						break;

					case '<':
						this.q.where(`${column} <= ?`, searchValue);
						break;

					default:
						this.q.where(`${column} = ?`, searchValue);
				}
			}
		}

		return this;
	}

	compareNumber(column: string, value: null | string | number, callback = null) {
		if ((value != null) && (value !== '')) {
			const result = String(value).match(this.filterRegExp);

			let searchValue: string | number = result[2].replace(/\s/g, '');
			searchValue = parseFloat(searchValue.replace(/,/g, '.'));

			if (isNaN(searchValue)) {
				this.q.where(`${column} is null`);
				return this;
			}

			const operator = result[1];

			if (callback && _.isFunction(callback)) {
				callback.call(this, operator, searchValue);
				return this;
			}

			switch (operator) {
				case '>':
					this.q.where(`${column} >= ?`, searchValue);
					break;

				case '<':
					this.q.where(`${column} <= ?`, searchValue);
					break;

				default:
					this.q.where(`${column} = ?`, searchValue);
			}
		}

		return this;
	}

	compareRmStatus(column) {
		const value = this.getSafeAttr('rmStatus') === '1' ? 'is not null' : 'is null';

		this.q.where(`${column} ${value}`);

		return this;
	}

	validatePerPage(value, options, field, attributes) {
		if (value === 'false') {
			value = false;
		} else {
			value = parseInt(value);
		}

		//		if value is not in validPageSize - set default @pageSize
		if (this.validPageSize.indexOf(value) === -1) {
			value = this.getDefault(field, 25);
		}

		attributes[field] = value;
	}

	validatePage(value, options, field, attributes) {
		value = parseInt(value);
		if (!value || (value < 0)) {
			value = 1;
		}

		attributes[field] = value;
	}

	validateOrder(value, options, field, attributes) {
		if (['asc', 'desc'].indexOf(value) === -1) {
			value = 'asc';
		}

		return attributes[field] = value;
	}

	validateSortBy(value, options, field, attributes) {
		const sortRules = this.sortRules();

		if (!_.isObject(sortRules.attrs)) {
			throw new Error('sortRules.attrs must be an object!');
		}

		if (!(value in sortRules.attrs)) {
			if (sortRules.default) {
				if (!Array.isArray(sortRules.default)) {
					throw new Error('sortRules.default must be an array!');
				}

				if (sortRules.default.length !== 1) {
					throw new Error('sortRules.default must be an array with length = 1');
				}

				const key = _.keys(sortRules.default[0])[0];

				if (!(key in sortRules.attrs)) {
					throw new Error('sortRules: default key must be specified in attrs!');
				}

				attributes[field] = key;
				return attributes['order'] = sortRules.default[0][key];
			} else {
				return attributes[field] = null;
			}
		}
	}

	validateRmStatus(value, options, field, attributes) {
		if (['0', '1'].indexOf(value) === -1) {
			return attributes[field] = this.getDefault(field);
		}
	}
}

export type TPreparedData = [IDataProviderMetaResult, any[]];