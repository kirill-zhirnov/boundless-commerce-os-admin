import {IInstanceConfig} from './config';

export interface IClientInstanceInfo {
	instance_id: number;
	tariff_alias: null|string;
	tariff_billing_period: null|TTariffBillingPeriod;
	tariff_amount: null|string;
}

export enum TInstanceStatus {
	inTheMaking = 'inTheMaking',
	awaitingForClient = 'awaitingForClient',
	available = 'available',
	unavailable = 'unavailable',
	awaitingForRemove = 'awaitingForRemove',
	removed = 'removed'
}

export interface IInstance {
	instance_id: number;
	status: TInstanceStatus;
	path: string|null;
	client_id: number|null;
	tariff_id: number|null;
	balance: string;
	currency_id: number|null;
	is_demo: boolean;
	available_since: string|null;
	unavailable_since: string|null;
	paid_till: string|null;
	remove_me: string|null;
	data: {[key: string]: any}|null;
	client_email: string|null;
	is_free: boolean;
	from_sample_id: number|null;
	config: IInstanceConfig|null;
	renew: boolean;
	quickpay_subscription_id: number|null;
}

export interface IInstanceBillingAddress {
	instance_id: number;
	first_name: string|null;
	last_name: string|null;
	is_company: boolean|null;
	company_name: string|null;
	vat_number: string|null;
	country_id: number|null;
	zip_code: string|null;
	state: string|null;
	city: string|null;
	address: string|null;
}

export enum TTariffBillingPeriod {
	day = 'day',
	month = 'month'
}

export interface ITariff {
	tariff_id: number;
	alias: string;
	billing_period: TTariffBillingPeriod;
	amount: string;
	currency_id: number;
	is_default: boolean;
	created_at: string;
	deleted_at: null|string;
	wix_alias: null|string;
}
export interface ITariffText {
	tariff_id: number;
	lang_id: number;
	title: string|null;
	description: string|null;
}

export interface ITariffInfo extends ITariff, ITariffText {
	currency_alias: string
}

export enum TInvoiceType {
	topUp = 'topUp',
	paymentForPeriod = 'paymentForPeriod'
}

export enum TInvoiceExtendForPeriod {
	month = 'month',
	year = 'year'
}

export interface IInvoice {
	invoice_id: number;
	instance_id: number;
	amount: string;
	title: null|string;
	description: null|string;
	type: TInvoiceType;
	data: {[key: string]: any};
	created_at: string;
	paid_at: string|null;
	extend_for: TInvoiceExtendForPeriod|null;
	number_of_periods: number|null;
}

export enum TPaymentTransactionStatus {
	created = 'created',
	awaitingForCallback = 'awaitingForCallback',
	completed = 'completed',
	cancelled = 'cancelled',
	exception = 'exception',
	refunded = 'refunded',
	rejected = 'rejected'
}

export interface IPaymentTransaction {
	payment_transaction_id: number;
	instance_id: number;
	payment_method_id: number;
	status: TPaymentTransactionStatus;
	amount: string;
	currency_id: number;
	external_id: string|null;
	person_id: number;
	data: null|{[key: string]: any};
	error: null|{[key: string]: any};
	created_at: string;
	invoice_id: number|null;
	refund_amount: string|null;
	refunded_at: string|null;
}

export enum TWixAppStatus {
	creating = 'creating',
	ready = 'ready'
}

export interface IWixApp {
	wix_app_id: number;
	wix_instance_id: string;
	status: TWixAppStatus;
	instance_id: number|null;
	refresh_token: string|null;
	data: null|{[key: string]: any};
	created_at: string;
}

export interface IPaymentMethod {
	payment_method_id: number;
	alias: string;
}