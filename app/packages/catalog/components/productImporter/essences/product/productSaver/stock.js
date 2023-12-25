import BasicSaver from '../basic';

const fieldRegExp = /^location_(\d+)$/;

export default class StockSaver extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.stock = [];
	}

	async processVariant() {
		if ('inStock' in this.dataRow) {
			if (this.dataRow.inStock && !this.variantInventoryItem.available_qty)
				await this.setVariantAvailable();
		} else {
			await this.setupStockByKeys(this.variantInventoryItem.item_id);
		}

		await this.saveStock();
	}

	async processProduct() {
		if (this.product.has_variants) {
			this.addProductLogMessage('Cannot update stock for product, since it has variants');
			return;
		}

		const productProp = await this.db.model('productProp').findOne({
			where: {
				product_id: this.product.product_id
			}
		});

		if ('inStock' in this.dataRow) {
			if (this.dataRow.inStock && !productProp.available_qty)
				await this.setProductAvailable();
		} else {
			await this.setupStockByKeys(this.inventoryItem.item_id);
		}

		await this.saveStock();
	}

	saveStock() {
		if (this.stock.length)
			return this.db.model('inventoryItem').setStock(this.stock, this.import.person_id, 'systemChangeQty', 'importChangeQty');
	}

	async setProductAvailable() {
		const row = await this.findSingleLocation();

		this.stock.push({
			item: this.inventoryItem.item_id,
			qty: 1,
			location: row.location_id
		});
	}

	async setVariantAvailable() {
		const row = await this.findSingleLocation();

		this.stock.push({
			item: this.variantInventoryItem.item_id,
			qty: 1,
			location: row.location_id
		});
	}

	setupStockByKeys(inventoryItemId) {
		Object.keys(this.dataRow).forEach((key) => {
			let result = key.match(fieldRegExp);

			if (!result)
				return;

			let val = this.prepareNumberVal(this.dataRow[key]);
			val = parseInt(val);

			if (isNaN(val) || val < 0)
				return;

			this.stock.push({
				item: inventoryItemId,
				qty: val,
				location: result[1]
			});
		});
	}

	async findSingleLocation() {
		await this.db.model('warehouse').checkWarehouseExists(this.i18n, this.lang.lang_id);

		const [row] = await this.db.sql(`
			select
				location_id
			from
				inventory_location
				inner join warehouse using(warehouse_id)
			where
				deleted_at is null
			limit 1
		`);

		return row;
	}
}