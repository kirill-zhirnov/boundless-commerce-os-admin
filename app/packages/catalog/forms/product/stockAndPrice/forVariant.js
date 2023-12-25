import BasicStockAndPrice from '../stockAndPrice';

/**
 * Stock and price for variant
 */
export default class StockPriceForVariant extends BasicStockAndPrice {
	async loadInventoryItem() {
		//@ts-ignore
		this.inventoryItem = await this.getModel('inventoryItem').findException({
			where: {
				//@ts-ignore
				variant_id: this.record.variant_id
			}
		});
	}
}