import BasicSaver from '../basic';
import PriceSaver from '../productSaver/price';
import StockSaver from '../productSaver/stock';

export default class UpdateVariant extends BasicSaver {
	async process() {
		await this.updateSku();
		await this.updatePrices();
		await this.updateStock();
	}

	updateStock() {
		let stockSaver = this.makeChildSaver(StockSaver);
		return stockSaver.processVariant();
	}

	updatePrices() {
		let priceSaver = this.makeChildSaver(PriceSaver);
		return priceSaver.processVariant();
	}

	async updateSku() {
		if (this.dataRow.external_id) {
			if (
				this.dataRow.external_id != this.product.external_id
				&& this.variant.sku != this.dataRow.external_id
			)
				await this.db.model('variant').updateSkuIfUnique(
					this.product.product_id,
					this.variant.variant_id,
					this.dataRow.external_id
				);
		} else if (this.dataRow.sku) {
			if (
				this.dataRow.sku != this.product.sku
				&& this.variant.sku != this.dataRow.sku
			)
				await this.db.model('variant').updateSkuIfUnique(
					this.product.product_id,
					this.variant.variant_id,
					this.dataRow.sku
				);
		}
	}
}