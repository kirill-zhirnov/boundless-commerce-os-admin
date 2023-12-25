import Form, {IOptionsList} from '../../../../modules/form/index';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import isValid from 'date-fns/isValid';
import differenceInDays from 'date-fns/differenceInDays';
import differenceInMonths from 'date-fns/differenceInMonths';
import {IOrderStatusModelStatic} from '../../../orders/models/orderStatus';
import squelOriginal from 'squel';

export default class SalesOverTimeForm extends Form<IAttrs> {
	protected dateFormat: string;
	protected chartDateFormat: string; //'DD.MM.YYYY';
	protected dbDateFormat: string = 'yyyy-MM-dd';
	protected primaryAliases = ['new', 'in_progress', 'sent', 'ready_to_ship', 'completed'];
	protected secondaryAliases = ['cancelled', 'refund'];
	protected defaultAttrs: IAttrs;
	protected isSubmitted: boolean;

	constructor(options) {
		super(options);
		this.isSubmitted = options.isSubmitted || false;

		const dateFormat = this.getClientRegistry().getLocale().getFormatDateOptions().dateShort;
		this.dateFormat = dateFormat;
		this.chartDateFormat = dateFormat;
	}

	getRules() {
		return [
			['groupByPeriod', 'inOptions', {options: 'groupByPeriod'}],
			['primary_statuses, secondary_statuses', 'inOptions', {
				options: 'orderStatuses',
				multiple: true
			}],
			['primary_statuses', 'validatePrimaryStatus'],
			['secondary_statuses', 'validateSecondaryStatus'],
			['groupByPeriod', 'validatePeriod'],
			['from, to', 'validateDate'],
		];
	}

	async setup() {
		await super.setup();
		await this.setupDefaultAttrs();
	}

	async getChartData() {
		const [data] = await this.getChartRows();
		const out = await this.getTplData();

		Object.assign(out, {data});
		return out;
	}

	async getChartRows() {
		const {groupByPeriod, from, to, primary_statuses, secondary_statuses} = this.getSafeAttrs();

		const escapedPeriod = this.getDb().escape(groupByPeriod);
		const escapedPeriodString = this.getDb().escape(`1 ${groupByPeriod}`);
		const escapedDateFormat = this.getDb().escape(this.chartDateFormat);
		const escapedFrom = this.getDb().escape(from);
		const escapedTo = this.getDb().escape(to);

		const q: squelOriginal.Select = this.getDb().squel().select() as squelOriginal.Select;

		q
			.field(`array_agg(to_char(range.order_period, ${escapedDateFormat}) order by range.order_period)`, 'chart_dates')
			.field('array_agg(coalesce(primary_chart.total_sum, 0) order by range.order_period)', 'primary_chart_sum')
			.field('coalesce(sum(primary_chart.total_sum), 0)', 'primary_total_sum')
			.field('coalesce(sum(primary_chart.total_shipping), 0)', 'primary_total_shipping')
			.field('count(primary_chart.total_sum)', 'primary_total_qty')
			.from(`(
				select
					date(generate_series) as order_period
				from
					generate_series(date_trunc(${escapedPeriod}, ${escapedFrom}::timestamp), date_trunc(${escapedPeriod}, ${escapedTo}::timestamp), interval ${escapedPeriodString})
				order by
					order_period asc
			)`, 'range')
			.left_join(`(${this.makeOrdersSumSubSelect(groupByPeriod, primary_statuses, from, to)})`, 'primary_chart', 'primary_chart.period = range.order_period')
			;

		if (Array.isArray(secondary_statuses) && secondary_statuses.length) {
			q
				.field('array_agg(coalesce(secondary_chart.total_sum, 0) order by range.order_period)', 'secondary_chart_sum')
				.field('coalesce(sum(secondary_chart.total_sum), 0)', 'secondary_total_sum')
				.field('coalesce(sum(secondary_chart.total_shipping), 0)', 'secondary_total_shipping')
				.field('count(secondary_chart.total_sum)', 'secondary_total_qty')
				.left_join(`(${this.makeOrdersSumSubSelect(groupByPeriod, secondary_statuses, from, to)})`, 'secondary_chart', 'secondary_chart.period = range.order_period')
				;
		}

		return await this.getDb().execSquel(q);
	}

	makeOrdersSumSubSelect(groupByPeriod, statuses, from, to) {
		const escapedPeriod = this.getDb().escape(groupByPeriod);
		const escapedFrom = this.getDb().escape(from);
		const escapedTo = this.getDb().escape(to);

		return `
			select
				date_trunc(${escapedPeriod}, orders.created_at) as period,
				sum(orders.total_price) as total_sum,
				sum(orders.service_total_price) as total_shipping
			from
				orders
			where
				orders.status_id in (${this.getDb().escapeIn(statuses)})
				and orders.publishing_status = 'published'
				and orders.created_at between ${escapedFrom} and ${escapedTo}
			group by period
		`;
	}

	async setupDefaultAttrs() {
		const savedStatuses = null; // await this.getInstanceRegistry().getSettings().get('dashboard', 'chartStatuses');

		const primary_statuses = savedStatuses?.primary || await this.getOrderStatusesByAlias(this.primaryAliases);
		const secondary_statuses = savedStatuses?.secondary || await this.getOrderStatusesByAlias(this.secondaryAliases);

		this.defaultAttrs = {
			groupByPeriod: TGroupByPeriod.day,
			from: format(this.getDefaultPeriod().start, this.dateFormat),
			to: format(this.getDefaultPeriod().end, this.dateFormat),
			primary_statuses,
			secondary_statuses
		};
	}

	getDefaultPeriod() {
		const today = new Date();

		return {
			start: startOfMonth(today),
			end: endOfMonth(today)
		};
	}

	isPeriodValid(period: TGroupByPeriod, from: string, to: string) {
		if (!from || !to || !period) return false;
		const parsedFrom = parse(from, this.dateFormat, new Date());
		const parsedTo = parse(to, this.dateFormat, new Date());

		if (period === TGroupByPeriod.month && differenceInMonths(parsedTo, parsedFrom) < 2)
			return false;
		if (period === TGroupByPeriod.week && differenceInDays(parsedTo, parsedFrom) < 8)
			return false;

		return true;
	}

	isRangeValid(from: string, to: string) {
		if (!from || !to) return false;
		const parsedFrom = parse(from, this.dateFormat, new Date());
		const parsedTo = parse(to, this.dateFormat, new Date());
		if (differenceInDays(parsedTo, parsedFrom) < 1)
			return false;

		return true;
	}

	validatePeriod(value, options, field) {
		if (this.isSubmitted) {
			const {from, to} = this.attributes;
			if (!this.isPeriodValid(value, from, to)) {
				this.addError(field, 'invalidPeriod', 'Group-by period should correspond to the date range');
			}
		} else {
			this.attributes[field] = this.defaultAttrs[field];
		}
		return true;
	}

	validateDate(value, options, field) {
		if (!value) {
			if (this.isSubmitted) {
				this.addError(field, 'invalidDate', 'String should be a date');
			} else {
				this.attributes[field] = this.defaultAttrs[field];
			}
			return true;
		}

		const parsedDate = parse(value, this.dateFormat, new Date());
		if (!isValid(parsedDate)) {
			this.addError(field, 'invalidDate', 'String should be a date');
			return true;
		}

		const {from, to} = this.attributes;
		if (!this.isRangeValid(from, to)) {
			this.addError('to', 'invalidDate', 'End date should after start date for at least 1 day');
			return true;
		}

		this.attributes[field] = format(parsedDate, this.dbDateFormat);
	}

	validatePrimaryStatus(value, options, field) {
		if (!value || !Array.isArray(value) || !value.length || !value[0]) {
			if (this.isSubmitted) {
				this.addError('primary_statuses[]', 'isRequired', 'Please select at least one status for the chart');
			} else {
				this.attributes[field] = this.defaultAttrs[field];
			}
		}
		return true;
	}

	validateSecondaryStatus(value, options, field) {
		if (!this.isSubmitted) {
			this.attributes[field] = this.defaultAttrs[field];
		}
	}

	async getOrderStatusesByAlias(aliases: string[]) {
		const rows = await this.db.sql<{status_id: number}>(`
			select
				status_id
			from
				order_status
			where
				alias in (?)
		`, [aliases]);

		return rows.map(el => String(el.status_id));
	}

	async rawOptions(): Promise<IOptionsList> {
		return {
			groupByPeriod: [
				[TGroupByPeriod.day, this.__('Day')],
				[TGroupByPeriod.week, this.__('Week')],
				[TGroupByPeriod.month, this.__('Month')]
			],
			orderStatuses: await (this.getModel('orderStatus') as IOrderStatusModelStatic).findTreeOptions(this.getEditingLang().lang_id)
		};
	}
}

interface IAttrs {
	from: string;
	to: string;
	groupByPeriod: TGroupByPeriod
	primary_statuses: string[];
	secondary_statuses: string[];
}

enum TGroupByPeriod {
	day = 'day',
	week = 'week',
	month = 'month',
}