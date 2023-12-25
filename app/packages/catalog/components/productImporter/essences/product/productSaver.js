import ImportCategory from '../category';
import _ from 'underscore';

import BasicSaver from './basic';
import StockSaver from './productSaver/stock';
import PriceSaver from './productSaver/price';
import ImagesSaver from './productSaver/images';
import Characteristics from './productSaver/characteristics';
import ProductProperties from './productSaver/productProperties';
import onEssenceChanged from '../../../../../system/modules/onEssenceChanged';

export default class ProductSaver extends BasicSaver {
	/**
	 *
	 * @param {String} scenario, supported scenarios: createProduct, updateProduct
	 * @returns {Promise<any>}
	 */
	async process(scenario) {
		this.scenario = scenario;

		if (['createProduct', 'updateProduct'].indexOf(this.scenario) == -1)
			throw new Error(`Unsupported scenario for ProductSaver: ${this.scenario}`);

		this.saveInLogs();

		await this.setup();
		await this.saveProductProps();
		await this.saveCategoryRel();
		await this.updateStock();
		await this.updatePrices();
		await this.updateImages();
		await this.updateProductCharacteristics();
		await onEssenceChanged.trigger(this.instance, 'product', [this.product.product_id], 'change');
	}

	saveInLogs() {
		let relStatus = null;
		switch (this.scenario) {
			case 'createProduct':
				relStatus = 'created';

				this.logger.addInserted();
				this.logger.reduceAvailableToAdd();

				break;

			case 'updateProduct':
				relStatus = 'updated';

				this.logger.addUpdated();
				break;
		}

		Object.assign(this.productImportRel, {
			product_id: this.product.product_id,
			status: relStatus
		});
	}

	async setup() {
		await this.setupI18n();
		//@ts-ignore
		const row = await this.db.model('inventoryItem').findException({
			where: {
				product_id: this.product.product_id
			}
		});

		this.inventoryItem = row;
	}

	updateProductCharacteristics() {
		let characteristicsSaver = this.makeChildSaver(Characteristics);
		return characteristicsSaver.process();
	}

	updateImages() {
		let imgsSaver = this.makeChildSaver(ImagesSaver);
		return imgsSaver.process();
	}

	updatePrices() {
		let priceSaver = this.makeChildSaver(PriceSaver);
		return priceSaver.processProduct();
	}

	updateStock() {
		let stockSaver = this.makeChildSaver(StockSaver);
		return stockSaver.processProduct();
	}

	async saveCategoryRel() {
		if (!this.dataRow.category && !this.dataRow.external_category_id)
			return;

		let importCategory = new ImportCategory(this.instance, this.import, this.logger);
		const category = await importCategory.process(_.pick(this.dataRow, ['category', 'external_category_id']));

		if (category) {
			let attrs = {
				category_id: category.category_id,
				product_id: this.product.product_id
			};

			return await this.db.model('productCategoryRel').findOrCreate({
				where: attrs,
				defaults: attrs
			});
		}
	}

	saveProductProps() {
		let productPropSaver = this.makeChildSaver(ProductProperties);
		return productPropSaver.process();
	}
}