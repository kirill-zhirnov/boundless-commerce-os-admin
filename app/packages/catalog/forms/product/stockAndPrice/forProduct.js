import BasicStockAndPrice from '../stockAndPrice';

/**
 * Stock and price for product without variants.
 */
export default class StockPriceForProduct extends BasicStockAndPrice {
	async loadInventoryItem() {
		//@ts-ignore
		const row = await this.getModel('inventoryItem').findException({
			where: {
				//@ts-ignore
				product_id: this.record.product_id
			}
		});

		this.inventoryItem = row;
	}

	async saveAvailability() {
		//@ts-ignore
		const {available_qty} = this.getSafeAttrs();
		let qty = parseInt(available_qty) === 1 ? 1 : 0;

		if (this.record.has_variants) {
			qty = 0;
		}

		//@ts-ignore
		await this.getModel('inventoryItem').updateItemsQty([this.inventoryItem.item_id], qty);
	}
}