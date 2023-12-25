export interface ICreateSubscriptionProps {
	order_id: string,
	currency: string,
	description: string;
}

export interface IUpdateSubscriptionLinkProps {
	id: number,
	amount: number,
	language?: string,
	continue_url?: string,
	cancel_url?: string,
	callback_url?: string,
	payment_methods?: string,
}

export interface IMakeRecurringPayment {
	id: number;
	amount: number;
	order_id: string;
	auto_capture: boolean;
}

export interface IPing {
	msg: string;
	scope: string;
	version: string;
}

export enum TSubscriptionType {
	Subscription = 'Subscription'
}
export enum TSubscriptionState {
	initial = 'initial',
	pending = 'pending',
	new = 'new',
	rejected = 'rejected',
	processed = 'processed',
}

export interface ISubscriptionModel {
	id: number;
	ulid: string|null;
	merchant_id: number;
	order_id: string;
	accepted: boolean;
	type: TSubscriptionType;
	text_on_statement: null|string;
	currency: string;
	state: TSubscriptionState;
	link: null|string;
	description: string;
	test_mode: boolean;
}

export interface IPaymentLinkUrlModel {
	url: string;
}