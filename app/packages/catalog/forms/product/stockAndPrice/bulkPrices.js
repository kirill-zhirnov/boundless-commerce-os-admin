import BasicStockAndPrice from '../stockAndPrice';
import * as utils from '../../../../../modules/utils/server';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class BulkPrices extends BasicStockAndPrice {
	getRules() {
		return [
			['price', 'validatePrice'],
		];
	}

	async save() {
		if (!Array.isArray(this.pk)) {
			this.addError('price', 'noArr', 'pk is not an array');
			return Promise.reject();
		}

		const attrs = this.getSafeAttrs();

		for (const price of this.prices) {
			const priceValue = attrs.price[`p-${price.price_id}`];
			const oldValue = attrs.price[`p-${price.price_id}_old`] || null;

			await this.savePrice(price.price_id, priceValue, oldValue);
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.pk
		);
	}

	async savePrice(priceId, priceValue, oldValue) {
		const currencyId = this.getInstanceRegistry().getCurrency().currency_id;

		for (const bunch of utils.splitArr(this.pk, 50)) {
			const items = await this.getDb().sql(`
				select
					item_id
				from
					vw_inventory_item
				where
					product_id in (${this.getDb().escapeIn(bunch)})
					and type in ('product', 'variant')
					and (lang_id = :lang or lang_id is null)
			`, {
				lang: this.getEditingLang().lang_id
			});

			for (const row of items) {
				//@ts-ignore
				await this.getModel('inventoryItem').setPrice(
					//@ts-ignore
					row.item_id,
					priceId,
					currencyId,
					priceValue,
					oldValue
				);
			}
		}
	}

	async setup() {
		await this.loadPrices();

		this.priceValues = {};

		this.prices.forEach((price) => {
			this.priceValues[price.price_id] = {};
		});
	}

	//@ts-ignore
	async getTplData() {
		const out = {
			prices: this.prices,
			priceValues: this.priceValues,
			pk: this.pk
		};

		return out;
	}
}