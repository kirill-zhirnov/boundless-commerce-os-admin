export interface IPaymentGateway {
	payment_gateway_id: number,
	alias: null | string,
	settings: null | { [key: string]: any },
	sort: number
}

export interface IPaymentMethod {
	payment_method_id: number,
	site_id: number,
	payment_gateway_id: null | number,
	for_all_delivery: null | boolean,
	config: null | { [key: string]: any },
	mark_up: number,
	sort: number,
	created_at: string,
	deleted_at: null | string
}

export interface IPaymentMethodText {
	payment_method_id: number;
	lang_id: number;
	title: string | null;
}