import {TPublishingStatus} from './db';

export interface IPerson {
	person_id: number;
	site_id: number;
	email: string|null;
	registered_at: string|null;
	created_at: null;
	deleted_at: string|null;
	is_owner: boolean;
	status: TPublishingStatus;
	created_by: number|null;
	personAddresses?: IPersonAddress[]
}

export interface IPersonProfile {
	person_id: number;
	first_name: string|null;
	last_name: string|null;
	patronymic: string|null;
	group_id: number|null;
	phone: string|null;
	receive_marketing_info: boolean;
	comment: string;
	custom_attrs: {[key: string]: any};
}

export interface IPersonRoleRel {
	person_id: number;
	role_id: number;
}

export interface IPersonAuth {
	person_id: number;
	pass: string|null;
	email_confirmed: string|null;
}

export enum TAddressType {
	billing = 'billing',
	shipping = 'shipping'
}

export interface IPersonAddress {
	address_id: number;
	person_id: number;
	type: TAddressType|null;
	is_default: boolean;
	first_name: string|null;
	last_name: string|null;
	company: string|null;
	address_line_1: string|null;
	address_line_2: string|null;
	city: string|null;
	state: string|null;
	country_id: number|null;
	zip: string|null;
	phone: string|null;
	comment: string|null;
	created_at: string;
}

export enum TRoleAlias {
	Guest = 'guest',
	Admin = 'admin',
	Client = 'client',
	GuestBuyer = 'guest-buyer',
	OrdersManager = 'orders-manager',
	ContentManager = 'content-manager',
}

export interface IRole {
	role_id: number;
	title: string;
	alias: TRoleAlias|null;
}

export interface IPersonAttrs {
	attr_id: number;
	title: string;
	key: string;
	type: TPersonAttrHtmlType;
	options: {[key: string]: any}|null;
	hint: string|null;
	sort: number;
}

export enum TPersonAttrHtmlType {
	text = 'text',
	text_area = 'text_area',
	checkbox = 'checkbox',
	dropdown = 'dropdown'
}
