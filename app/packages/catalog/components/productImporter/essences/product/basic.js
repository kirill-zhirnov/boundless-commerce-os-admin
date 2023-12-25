import {wrapperRegistry} from '../../../../../../modules/registry/server/classes/wrapper';
import * as env from '../../../../../../modules/env';

export default class BasicSaver {
	/**
	 * @param {Object} instanceRegistry - The instance registry
	 * @param {Object} logger - instance of ImportLogger: @p-catalog/productImporter/importLogger.
	 * @param {Object} product - Sequelize instance of row in `product`.
	 * @param {Object} dataRow - a data with importing row, e.g. object data from YML parser or CSV parser
	 */
	constructor(instanceRegistry, logger, product, dataRow) {
		this.instance = instanceRegistry;
		this.db = this.instance.getDb();
		this.logger = logger;
		this.import = logger.getImportRow();
		this.product = product;
		this.dataRow = dataRow;

		this.productImportRel = {};
		this.lang = null;
		this.i18n = null;
		this.scenario = null;

		/**
		 * Sequelize instance of row in `inventory_item` for product.
		 * @type {Object}
		 */
		this.inventoryItem = null;

		this.variant = null;
		this.variantInventoryItem = null;
	}

	prepareNumberVal(val) {
		if (!val)
			return 0;

		val = String(val).replace(',', '.');
		val = val.replace(/[^\d.]/g, '');
		val = val.replace(/\.+$/, '');

		return val;
	}

	addProductLogMessage(message) {
		if (!this.productImportRel.message) {
			this.productImportRel.message = [message];
		} else {
			this.productImportRel.message.push(message);
		}

		return;
	}

	setProductImportRel(val) {
		this.productImportRel = val;

		return this;
	}

	setLang(lang) {
		this.lang = lang;

		return this;
	}

	setI18n(i18n) {
		this.i18n = i18n;

		return this;
	}

	setScenario(scenario) {
		this.scenario = scenario;

		return this;
	}

	/**
	 * Create a new instance of ConstructorFunc. ConstructorFunc should be a heir of BasicSaver.
	 * Main reason to use this method - it passes own `productImportRel ` to child to save logs in children,
	 * on other cases logs will be lost.
	 *
	 * @param ConstructorFunc - class constructor, a heir of BasicSaver
	 * @returns {ConstructorFunc} instance of ConstructorFunc.
	 */
	makeChildSaver(ConstructorFunc) {
		let saver = new ConstructorFunc(this.instance, this.logger, this.product, this.dataRow);
		saver.setProductImportRel(this.productImportRel);

		if (this.inventoryItem)
			saver.setInventoryItem(this.inventoryItem);

		if (this.lang)
			saver.setLang(this.lang);

		if (this.i18n)
			saver.setI18n(this.i18n);

		if (this.scenario)
			saver.setScenario(this.scenario);

		if (this.variant)
			saver.setVariant(this.variant);

		if (this.variantInventoryItem)
			saver.setVariantInventoryItem(this.variantInventoryItem);

		return saver;
	}

	async setupI18n() {
		const row = await this.db.model('lang').findException({
			where: {
				lang_id: this.import.lang_id
			}
		});

		this.lang = row;

		const i18n = await wrapperRegistry.getI18nKit().createI18n(this.lang.code);
		this.i18n = i18n;
	}

	setInventoryItem(value) {
		this.inventoryItem = value;

		return this;
	}

	setVariant(value) {
		this.variant = value;

		return this;
	}

	setVariantInventoryItem(value) {
		this.variantInventoryItem = value;

		return this;
	}

	getVariantInventoryItem(value) {
		return this.variantInventoryItem;
	}

	getVariant() {
		return this.variant;
	}

	async getEnv() {
		const creator = env.create(this.instance);

		return creator.getEnv();
	}
}