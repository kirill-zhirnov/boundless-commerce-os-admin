import accounting from 'accounting';
import _ from 'underscore';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

export default class Locale {
	protected formatMoneyOptions: IFormatMoneyOptions = {};
	protected phone: IPhoneOptions | null = null;
	protected currency = null;
	protected formatDateOptions: IFormatDateOptions = {}

	constructor(options = {}) {
		Object.assign(this, _.pick(options, ['formatMoneyOptions', 'currency', 'phone', 'formatDateOptions']));
	}

	formatMoney(amount, options = {}) {
		options = _.extend({}, this.formatMoneyOptions, options);

		return accounting.formatMoney(amount, options);
	}

	formatNumber(amount, options = {}) {
		options = _.extend({}, this.formatMoneyOptions, options);

		return accounting.formatNumber(amount, options);
	}

	formatDate(date: string | Date, type: TDateFormatType = TDateFormatType.short) {
		const outDate = typeof date === 'string' ? parseISO(date) : date;

		let formatString = '';
		switch (type) {
			case TDateFormatType.short:
				formatString = this.formatDateOptions.dateShort || '';
				break;
			case TDateFormatType.medium:
				formatString = this.formatDateOptions.dateMedium || '';
				break;
			case TDateFormatType.long:
				formatString = this.formatDateOptions.dateLong || '';
				break;
		}
		formatString = formatString || 'MM/dd/yyyy';

		return format(outDate, formatString);
	}

	formatDateTime(date: string | Date, type: TDateFormatType = TDateFormatType.short) {
		const outDate = typeof date === 'string' ? parseISO(date) : date;
		let formatString = '';
		switch (type) {
			case TDateFormatType.short:
				formatString = this.formatDateOptions.dateTimeShort || '';
				break;
			case TDateFormatType.medium:
				formatString = this.formatDateOptions.dateTimeMedium || '';
				break;
			case TDateFormatType.long:
				formatString = this.formatDateOptions.dateTimeLong || '';
				break;
		}
		formatString = formatString || 'MM/dd/yyyy HH:mm';

		return format(outDate, formatString);
	}

	formatTime(date: string | Date) {
		const outDate = typeof date === 'string' ? parseISO(date) : date;
		const formatString = this.formatDateOptions.time || 'HH:mm';

		return format(outDate, formatString);
	}

	getCurrencySymbol() {
		return this.formatMoneyOptions.symbol;
	}

	getClientConfig() {
		return _.pick(this, 'formatMoneyOptions', 'currency', 'phone', 'formatDateOptions');
	}

	getFormatDateOptions() {
		return this.formatDateOptions;
	}

	getDatePickerFormat() {
		switch (this.formatDateOptions.dateShort) {
			case 'MM/dd/yy':
				return 'mm/dd/y';
			case 'dd.MM.yyyy':
				return 'dd.mm.yy';
			case 'yyyy-MM-dd':
				return 'yy-mm-dd';
			default:
				return 'mm/dd/y';
		}
	}

	getPhone() {
		return this.phone;
	}
}

export interface IFormatMoneyOptions {
	decimal?: string;
	thousand?: string;
	precision?: number,
	format?: string;
	symbol?: string;
}

export interface IFormatDateOptions {
	dateShort?: string;
	dateMedium?: string;
	dateLong?: string;
	dateTimeShort?: string;
	dateTimeMedium?: string;
	dateTimeLong?: string;
	time?: string;
}

export interface IPhoneOptions {
	mask: string;
	placeholder: string;
}

export enum TDateFormatType {
	short = 'short',
	medium = 'medium',
	long = 'long'
}