import validator from '../../../../../modules/validator/validator';
import errorLogger from '../../../../../modules/logger/error';
import ProductSearcher from './product/searcher';
import ProductSaver from './product/productSaver';
import VariantSaver from './product/variantSaver';

export default class ImportProductEssence {
	constructor(instanceRegistry, importRow, importLogger, dataRow) {
		this.instanceRegistry = instanceRegistry;
		this.importRow = importRow;
		this.importLogger = importLogger;
		this.dataRow = dataRow;
		this.db = this.instanceRegistry.getDb();
		this.productImportRel = {};

		this.searcher = null;
		this.product = null;
		this.variant = null;
		this.scenario = null;
	}

	async process() {
		this.prepareStringAttrs();

		try {
			this.searcher = new ProductSearcher(this.instanceRegistry, this.importLogger, this.dataRow);
			const result = await this.searcher.process();

			this.product = result.product;
			this.scenario = result.scenario;
			this.variant = result.variant;

			switch (this.scenario) {
				case 'createProduct':
					if (!this.importRow.settings.only_update && this.importLogger.isProductInsertAllowed()) {
						await this.createProduct();
					}
					break;
				case 'updateProduct':
					if (!this.importRow.settings.only_insert) {
						await this.updateProduct();
					}
					break;
				case 'appendVariant':
					if (!this.importRow.settings.only_update) {
						await this.saveVariant();
					}
					break;
				case 'updateVariant':
					if (!this.importRow.settings.only_insert) {
						await this.saveVariant();
					}
					break;
			}
			await this.saveProductImportRel();
		} catch (e) {
			console.error(e);
			this.productImportRel.status = 'error';
			this.productImportRel.message = e;

			if (this.product) {
				this.productImportRel.product_id = this.product.product_id;
			}

			if (this.variant) {
				this.productImportRel.variant_id = this.variant.variant_id;
			}

			try {
				await this.saveProductImportRel();
			} catch (err) {
				console.error(err);
				errorLogger.error(err);
			}
		}
	}

	prepareStringAttrs() {
		const strAttrs = [
			'external_id',
			'external_category_id',
			'name',
			'description',
			'manufacturer',
			'sku',
			'offerGroupId'
		];


		for (const attr of strAttrs) {
			if (attr in this.dataRow) {
				if (!this.dataRow[attr]) {
					this.dataRow[attr] = '';
				}

				this.dataRow[attr] = validator.trim(String(this.dataRow[attr]));
			}
		}
	}

	saveVariant() {
		const saver = this.createSaver(VariantSaver);

		saver.setParamsDiff(this.searcher.getParamsDiff());

		return saver.process(this.scenario);
	}

	updateProduct() {
		const saver = this.createSaver(ProductSaver);
		return saver.process(this.scenario);
	}

	createSaver(Constructor) {
		const saver = new Constructor(this.instanceRegistry, this.importLogger, this.product, this.dataRow);
		saver.setProductImportRel(this.productImportRel);

		if (this.variant) {
			saver.setVariant(this.variant);
		}

		return saver;
	}

	async createProduct() {
		const group = await this.db.model('commodityGroup').getDefaultCommodityGroup(this.importRow.lang_id, 'Default Product Type');

		const res = await this.db.model('product').create({
			group_id: group.group_id
		});
		this.product = res;
		await this.updateProduct();
	}

	async saveProductImportRel() {
		//		if there is no status - do not save - row was skipped by limits
		if (!this.productImportRel.status) {
			return;
		}

		this.productImportRel.log_id = this.importLogger.getLogId();

		await this.db.model('productImportRel').create(this.productImportRel);
	}
}