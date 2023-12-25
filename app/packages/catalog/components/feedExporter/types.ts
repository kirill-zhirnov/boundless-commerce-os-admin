import {TVwInventoryItem} from '../../../../@types/inventoryItem';
import {IDataProviderMetaResult} from '../../../../@types/dataProvider';

export type TExportableItem = Omit<TVwInventoryItem, 'prices'> & {
	images: {image_id: number, path: string, is_default: boolean}[];
	product_description: string|null;
	product_labels: {label_id: number, title: string}[],
	manufacturer_title: null|string,
	selling_price?: {
		point_id: number;
		price_id: number;
		alias: string;
		currency_id: number;
		currency_alias: string;
		value: number;
		is_auto_generated: boolean;
		old: number|null;
	}
};
export type TDataFeed = [IDataProviderMetaResult, TExportableItem[]];