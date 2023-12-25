import {TVwInventoryItem} from './inventoryItem';
import {TPublishingStatus} from './db';
import {TQueueEventType} from './rabbitMq';

export interface IItemPrice {
	item_price_id: number;
	price_id: number;
	basic_price: number;
	final_price: number;
	discount_amount: number;
	discount_percent: number;
}

export type TOrdersItem = TVwInventoryItem & IItemPrice & {
	qty: number;

	created_at: string;
	basket_item_id?: number;

	reserve_item_id?: number;
	reserve_id?: number;
	stock_id?: number|null;
	completed_at?: string|null;
};

export enum TDiscountType {
	fixed = 'fixed',
	percent = 'percent'
}

export enum TOrderDiscountSource {
	manual = 'manual',
	coupon = 'coupon'
}

export interface ICouponCampaign {
	campaign_id: number;
	title: string;
	discount_type: TDiscountType|null;
	discount_value: number|null;
	limit_usage_per_code: number|null;
	limit_usage_per_customer: number|null;
	min_order_amount: number|null;
	created_at: string;
	deleted_at: string|null;
}

export interface ICouponCode {
	code_id: number;
	campaign_id: number;
	code: string;
	created_at: string;
}

export interface IOrderDiscount {
	discount_id: number;
	order_id: number;
	title: string|null;
	discount_type: TDiscountType|null;
	value: number|null;
	source: TOrderDiscountSource|null;
	code_id: number|null;
	created_at: string;
}

export interface IOrderProp {
	order_id: number;
	client_comment: string|null;
	custom_attrs: {[key: string]: any}|null;
}

export enum TOrderAttrHtmlType {
	text = 'text',
	text_area = 'text_area',
	checkbox = 'checkbox',
	dropdown = 'dropdown'
}

export interface IOrderAttrs {
	attr_id: number;
	title: string;
	key: string;
	type: TOrderAttrHtmlType;
	options: {[key: string]: any}|null;
	hint: string|null;
	sort: number;
}

export interface ITrackNumber {
	track_number_id: number;
	order_id: number;
	track_number: string|null;
	created_at: string;
}

export interface IOrderHistory {
	history_id: number;
	order_id: number;
	status_id: number;
	person_id: number|null;
	changed_at: string;
}

export enum TOrderStatusAlias {
	in_progress = 'in_progress',
	sent = 'sent',
	completed = 'completed',
	ready_to_ship = 'ready_to_ship',
	new = 'new',
	cancelled = 'cancelled',
	refund = 'refund',
}

export enum TOrderStatusStockLocation {
	inside = 'inside',
	outside = 'outside',
	basket = 'basket'
}

export interface IOrderStatus {
	status_id: number;
	parent_id: number|null;
	alias: TOrderStatusAlias|null;
	background_color: string|null;
	stock_location: TOrderStatusStockLocation;
	sort: number;
	created_at: string;
	deleted_at: string|null;
	orderStatusTexts?: IOrderStatusText[]
}

export interface IOrderStatusText {
	status_id: number;
	lang_id: number;
	title: string|null;
}

export interface IOrder {
	order_id: number;
	source_id: number | null;
	status_id: number | null;
	point_id: number | null;
	customer_id: number | null;
	basket_id: number | null;
	payment_method_id: number | null;
	service_total_price: string | null;
	service_total_qty: number | null;
	total_price: string | null;
	created_by: number | null;
	created_at: string;
	paid_at: string;
	payment_mark_up: string;
	discount_for_order: string;
	got_cash_at: string;
	publishing_status: TPublishingStatus;
	public_id: string;

	orderStatus?: IOrderStatus
}

export enum TNotifyTransport {
	email = 'email'
}

export interface INotificationTemplate {
	template_id: number;
	status_id: number|null;
	transport: TNotifyTransport|null;
	subject: null|string;
	template: null|string;
	event_type: TQueueEventType|null;
}