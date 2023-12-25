import BasicStockAndPrice from '../../stockAndPrice';
import * as productEvents from '../../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../../@types/rabbitMq';

/**
 * Variants set prices
 */
export default class VariantsSetPrices extends BasicStockAndPrice {
	constructor(options) {
		super(options);

		this.variants = null;
	}

	getRules() {
		return [
			['price', 'validatePrice'],
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const	currencyId = this.getInstanceRegistry().getCurrency().currency_id;
		const productId = this.variants[0]?.product_id;

		for (const variant of this.variants) {
			for (const price of this.prices) {
				let priceValue = attrs.price[`p-${price.price_id}`],
					oldValue = attrs.price[`p-${price.price_id}_old`] || null
				;

				//@ts-ignore
				await this.getModel('inventoryItem').setPrice(
					//@ts-ignore
					variant.inventoryItem.item_id,
					price.price_id,
					currencyId,
					priceValue,
					oldValue
				);
			}
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productId
		);
	}

	async setup() {
		await this.loadPrices();
		await this.loadVariants();

		this.priceValues = {};
		this.prices.forEach((price) => {
			if (!(price.price_id in this.priceValues))
				this.priceValues[price.price_id] = {};
		});
	}

	//@ts-ignore
	async getTplData() {
		let out = {
			prices: this.prices,
			priceValues: this.priceValues,
			pk: this.pk
		};

		return out;
	}

	async loadVariants() {
		if (!Array.isArray(this.pk))
			throw new Error('PK must be an Array');

		this.variants = await this.getModel('variant').findAll({
			include: [
				{model: this.getModel('inventoryItem')}
			],
			where: {
				variant_id: this.pk
			}
		});

		if (!this.variants.length) {
			throw new Error('Variants not found!');
		}
	}

	getVariants() {
		return this.variants;
	}
}