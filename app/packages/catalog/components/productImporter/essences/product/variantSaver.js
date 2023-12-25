import ProductSaver from './productSaver';

import AppendVariant from './variantSaver/appendVariant';
import UpdateVariant from './variantSaver/updateVariant';
import ProductProperties from './productSaver/productProperties';
import SphinxProductIndexer from '../../../../../system/modules/sphinx/productIndexer';

export default class VariantSaver extends ProductSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.paramsDiff = null;
	}

	/**
	 *
	 * @param {String} scenario, supported scenarios: appendVariant, updateVariant
	 */
	async process(scenario) {
		this.scenario = scenario;

		if (['appendVariant', 'updateVariant'].indexOf(this.scenario) == -1)
			throw new Error(`Unsupported scenario for VariantSaver: ${this.scenario}`);

		await this.setup();
		await this.saveProductProps();
		await this.saveCategoryRel();
		if (this.scenario == 'appendVariant')
			await this.appendVariant();
		const row = await this.db.model('inventoryItem').findOne({
			where: {
				variant_id: this.variant.variant_id
			}
		});
		this.variantInventoryItem = row;

		await this.updateVariant();

		await this.updateProductCharacteristics();
		await this.updateImages();
		this.saveInLogs();

		const env = await this.getEnv();

		const indexer = new SphinxProductIndexer(env);
		await indexer.reIndexProduct(this.product.product_id);
	}

	saveInLogs() {
		Object.assign(this.productImportRel, {
			status: this.scenario,
			product_id: this.product.product_id,
			variant_id: this.variant.variant_id
		});

		switch (this.scenario) {
			case 'appendVariant':
				this.logger.addAppendedVariants();
				break;

			case 'updateVariant':
				this.logger.addUpdatedVariants();
				break;
		}
	}

	setup() {
		return this.setupI18n();
	}

	updateVariant() {
		let updateVariant = this.makeChildSaver(UpdateVariant);
		return updateVariant.process();
	}

	async appendVariant() {
		let appendVariant = this.makeChildSaver(AppendVariant);
		appendVariant.setParamsDiff(this.paramsDiff);

		await appendVariant.process();
		this.variant = appendVariant.getVariant();
	}

	saveProductProps() {
		let productProps = this.makeChildSaver(ProductProperties);
		productProps.setAllowToSave([
			'status',
			'offerGroupId'
		]);

		return productProps.process();
	}

	setParamsDiff(val) {
		this.paramsDiff = val;

		return this;
	}
}