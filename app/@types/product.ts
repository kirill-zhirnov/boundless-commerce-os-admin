import {TPublishingStatus} from './db';

export enum TTaxStatus {
	taxable = 'taxable',
	none = 'none'
}

export interface IProduct {
	product_id: number;
	sku: string|null;
	manufacturer_id: number|null;
	group_id: number|null;
	created_at: string;
	deleted_at: string|null;
	has_variants: boolean;
	external_id: string|null;
	status: TPublishingStatus;
	created_by: number|null;
}

export interface IProductProp {
	product_id: number;
	available_qty: number;
	reserved_qty: number;
	layout: string|null;
	country_of_origin: number|null;
	extra: {[key: string]:any}|null;
	size: {[key: string]:any};
	characteristic: {[key: string]:any}|null;
	tax_status: TTaxStatus;
	tax_class_id: number|null;
}