export enum TProductType {
	digital = 'digital',
	material = 'material'
}

export interface ICommodityGroup {
	group_id: number;
	type: TProductType|null;
	unit_id: number|null;
	not_track_inventory: boolean;
	created_at: string;
	deleted_at: string|null;
	yml_export: boolean;
	is_default: boolean;
	vat: string;
	physical_products: boolean;
}

export interface ICollection {
	collection_id: number;
	site_id: number;
	lang_id: number;
	title: string|null;
	alias: string|null;
	created_at: string;
	deleted_at: string|null;
}

export enum TFeedType {
	googleShopping = 'google-shopping',
	facebook = 'facebook'
}

export interface IFeeds {
	feed_id: number;
	title: string;
	type: TFeedType,
	conditions: {
		manufacturer: number|null;
		collection: number|null;
		commodity_group: number|null;
		categories: number[];
	};
	data: {
		shop_url?: string;
		product_url_template?: string;
		shop_title?: string;
		shop_description?: string;
	};
	is_protected: null|{login: string, pass: string};
	created_at: string;
	deleted_at: string|null;
}