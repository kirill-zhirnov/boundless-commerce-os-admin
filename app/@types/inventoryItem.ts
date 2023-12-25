import {TPublishingStatus} from './db';
import {TTaxStatus} from './product';

export enum TInventoryType {
	variant = 'variant',
	product = 'product',
	customItem = 'custom_item'
}

export interface IVwInventoryItemRaw {
	item_id: number;
	type: TInventoryType;
	track_inventory: boolean;
	available_qty: number;
	reserved_qty: number;
	product_id: number;
	variant_id: number;
	custom_item_id: number;
	status: TPublishingStatus;
	deleted_at: string;
	lang_id: number;
	product: {
		product_id: number|null;
		sku: string|null;
		has_variants: boolean|null;
		title: string|null;
		url_key: string|null;
		default_category_id: number|null;
		manufacturer_id: number|null;
		tax_status: TTaxStatus|null;
		tax_class_id: number|null;
	};
	variant: {
		variant_id: number|null;
		sku: string|null;
		title: string|null;
	};
	custom_item: {
		custom_item_id: number|null;
		title: string|null;
	};
	prices: {
		point_id: number[];
		price_id: number[];
		alias: string[];
		currency_id: number[];
	}
}

export type TVwInventoryItem = IVwInventoryItemRaw & {
	prices: {}[],
	// labels: {}[] - is it a bug?
}

export interface IInventoryItem {
	item_id: number;
	product_id: number|null;
	variant_id: number|null;
	custom_item_id: number|null;
	available_qty: number;
	reserved_qty: number;
}