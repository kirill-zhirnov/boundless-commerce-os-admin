import {IFeedsModel} from '../../models/feeds';
import {TExportableItem} from './types';
import {IInstanceRegistry} from '../../../../@types/registry/instanceRegistry';
import {TInventoryType} from '../../../../@types/inventoryItem';

export default class BasicFeed {
	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected feed: IFeedsModel
	) {
	}

	makeProductUrl(item: TExportableItem): string {
		const {shop_url, product_url_template} = this.feed.data;

		let url = String(product_url_template).replace('{product_id}', String(item.product.product_id));
		url = url.replace('{product_slug}', String(item.product.url_key));

		return `${shop_url}${url}`;
	}

	makeItemTitle(item: TExportableItem): string {
		const out = [item.product.title!];

		if (item.type == TInventoryType.variant) {
			out.push(item.variant.title);
		}

		return out.join(' - ');
	}
}