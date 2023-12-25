export enum TCurrencyAlias {
	usd = 'usd'
}

export interface ICurrency {
	currency_id: number;
	alias: string;
	code: number;
}

export interface ITaxClass {
	tax_class_id: number;
	title: string;
	is_default: boolean;
	created_at: string;
	taxRates?: ITaxRate[];
}

export interface ITaxRate {
	tax_rate_id: number;
	tax_class_id: number;
	title: string;
	rate: string;
	priority: number;
	is_compound: boolean;
	include_shipping: boolean;
	country_id?: number;
	state_code?: string;
	created_at: string;
}