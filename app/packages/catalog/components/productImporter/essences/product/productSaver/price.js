import BasicSaver from '../basic';

const priceRegExps = [
	{
		regExp: /^price_(\d+)$/,
		key: 'price'
	},
	{
		regExp: /^price_(\d+)_old$/,
		key: 'oldPrice'
	},
];

export default class PriceSaver extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.prices = [];
	}

	/**
	 * @returns {Promise}
	 */
	async processProduct() {
		if (this.product.has_variants) {
			this.addProductLogMessage('Cannot update price for product, since it has variants.');
			return;
		}

		this.mapPricesColumns(this.inventoryItem.item_id);

		await this.db.model('inventoryItem').setPrices(this.prices);
	}

	/**
	 * @returns {Promise}
	 */
	processVariant() {
		this.mapPricesColumns(this.variantInventoryItem.item_id);

		return this.db.model('inventoryItem').setPrices(this.prices);
	}

	mapPricesColumns(inventoryItemId) {
		let prices = {};

		Object.keys(this.dataRow).forEach((key) => {
			let priceId = null,
				fieldKey = null;

			for (let i = 0; i < priceRegExps.length; i++) {
				let item = priceRegExps[i];

				let parseRes = key.match(item.regExp);
				if (parseRes) {
					priceId = parseRes[1];
					fieldKey = item.key;
					break;
				}
			}

			if (!priceId)
				return;

			let val = this.prepareNumberVal(this.dataRow[key]);
			val *= 1;

			if (isNaN(val) || val < 0)
				return;

			if (!prices[priceId])
				prices[priceId] = {};

			prices[priceId][fieldKey] = val;
		});

		Object.keys(prices).forEach((priceId) => {
			if (!('price' in prices[priceId]))
				return;

			this.prices.push(Object.assign({
				itemId: inventoryItemId,
				priceId: priceId,
				currencyId: this.instance.getCurrency().currency_id
			}, prices[priceId]));
		});
	}
}