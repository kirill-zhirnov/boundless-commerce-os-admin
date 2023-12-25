import BasicSaver from '../basic';

import VariantsCreator from '../../../../../modules/variantsCreator';
import VariantCharacteristics from './characteristics';

export default class AppendVariant extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.paramsDiff = null;

		/**
		 * Whether or not product had variants, before the process was started.
		 *
		 * @type {boolean}
		 */
		this.productHadVariants = this.product.has_variants;
		this.characteristicsForAppendingVariant = null;
	}

	async process() {
		if (!this.paramsDiff)
			throw new Error('You need to set paramsDiff before calling this function.');

		await this.processAppendingVariant();
		if (!this.productHadVariants)
			await this.createVariantByProduct();
	}

	async processAppendingVariant() {
		const characteristicsForAppendingVariant = await this.getCharacteristicsForAppendingVariant();

		this.characteristicsForAppendingVariant = characteristicsForAppendingVariant;

		if (characteristicsForAppendingVariant.length < 1)
			throw 'Cannot append variant: characteristicsForAppendingVariant are less than 2.';

		let creator = new VariantsCreator([], this.product, this.db, this.lang.lang_id);
		const variantId = await creator.makeVariantRow(characteristicsForAppendingVariant, true);
		const row = await this.db.model('variant').findOne({
			where: {
				variant_id: variantId
			}
		});

		this.variant = row;
	}

	saveVariantSkuIfUnique(variantId, sku) {
		return this.db.model('variant').updateSkuIfUnique(this.product.product_id, variantId, sku);
	}

	async getCharacteristicsForAppendingVariant() {
		let out = [],
			diff = {},
			characteristics
			;

		const res = await this.paramsDiff.getParamsDiffForVariant();

		diff = res;

		//make sure, that all characteristics and cases exists in database:
		characteristics = this.makeChildSaver(VariantCharacteristics);
		characteristics.setShallProcessItemClb((item) => {
			let name = item.name.toLowerCase(),
				val = item.value.toLowerCase();

			if (!(name in diff))
				return false;

			if (diff[name].indexOf(val) == -1)
				return false;

			return true;
		});

		await characteristics.process();

		const idCases = characteristics.getIdCases();

		for (const characteristicId of idCases) {
			if (!idCases[characteristicId].length) continue;

			const row = await this.db.model('characteristicTypeCaseText').findOne({
				where: {
					case_id: idCases[characteristicId][0],
					lang_id: this.lang.lang_id
				}
			});

			out.push({
				characteristic_id: characteristicId,
				option: [row.case_id, row.title]
			});

		}

		return out;
	}

	/**
	 * If we appending variant to a product, which does not have variant - we need to create another
	 * variant for product and save stock and prices to the variant.
	 *
	 * @returns {Promise}
	 */
	async createVariantByProduct() {
		const characteristicsForVariant = await this.getCharacteristicsForVariantByProduct();
		if (characteristicsForVariant.length != this.characteristicsForAppendingVariant.length)
			throw 'Cannot convert product to variant: characteristicsForVariant.length != this.characteristicsForAppendingVariant.length';

		let creator = new VariantsCreator([], this.product, this.db, this.lang.lang_id);
		const productVariantId = await creator.makeVariantRow(characteristicsForVariant, true);

		const inventoryItems = await this.loadProductInventoryItems(productVariantId);

		await this.copyProductPricesToVariant(inventoryItems.product, inventoryItems.variant);
		await this.copyProductStockToVariant(inventoryItems.product, inventoryItems.variant);
		await this.moveProductExternalIdToVariant(productVariantId);
		await this.moveProductSkuToVariant(productVariantId);
		await this.product.reload();
	}

	async moveProductSkuToVariant(productVariantId) {
		if (this.import.settings.detect_variants_by == 'sku')
			return;

		if (!this.product.sku)
			return;

		await this.db.model('variant').updateSkuIfUnique(
			this.product.product_id,
			productVariantId,
			this.product.sku
		);
		await this.product.set({sku: null}).save();
	}

	async moveProductExternalIdToVariant(productVariantId) {
		if (!this.product.external_id) return;

		const productVariantSkuSaved = await this.saveVariantSkuIfUnique(productVariantId, this.product.external_id);

		if (productVariantSkuSaved)
			await this.product.set({external_id: null}).save();
	}

	async copyProductStockToVariant(productItemId, variantItemId) {
		const rows = await this.db.model('inventoryStock').findAll({
			where: {
				item_id: productItemId
			}
		});

		let stock = [];

		rows.forEach((row) => {
			if (!row.available_qty)
				return;

			stock.push({
				location: row.location_id,
				item: productItemId,
				qty: 0
			});

			stock.push({
				location: row.location_id,
				item: variantItemId,
				qty: row.available_qty
			});
		});

		if (stock.length)
			await this.db.model('inventoryItem').setStock(stock, this.import.person_id, 'systemChangeQty', 'importChangeQty');
	}

	async copyProductPricesToVariant(productItemId, variantItemId) {
		await this.db.model('inventoryItem').copyPrices(productItemId, variantItemId);
		await this.db.model('inventoryPrice').destroy({
			where: {
				item_id: productItemId
			}
		});
	}

	async loadProductInventoryItems(productVariantId) {
		const rows = await this.db.sql(`
			select
				item_id,
				product_id,
				variant_id
			from
				inventory_item
			where
				product_id = :product
				or variant_id = :variant
		`, {
			product: this.product.product_id,
			variant: productVariantId
		});

		let out = {};

		rows.forEach((row) => {
			if (row.product_id) {
				out.product = row.item_id;
			} else {
				out.variant = row.item_id;
			}
		});

		return out;
	}

	async getCharacteristicsForVariantByProduct() {
		let characteristicsForVariant = [],
			characteristicsIds = [],
			casesIds = []
			;

		this.characteristicsForAppendingVariant.forEach((item) => {
			if (characteristicsIds.indexOf(item.characteristic_id) == -1)
				characteristicsIds.push(item.characteristic_id);

			if (casesIds.indexOf(item.option[0]) == -1)
				casesIds.push(item.option[0]);
		});

		const rows = await this.db.sql(`
			select
				characteristic_id,
				case_id,
				title
			from
				characteristic_product_val
				inner join characteristic_type_case_text using(case_id)
			where
				product_id = :product
				and characteristic_id in (${this.db.escapeIn(characteristicsIds)})
				and lang_id = :lang
				and case_id not in (${this.db.escapeIn(casesIds)})
		`, {
			product: this.product.product_id,
			lang: this.lang.lang_id
		});

		let __uniqCharact = {};

		rows.forEach((row) => {
			if (__uniqCharact[row.characteristic_id])
				return;

			__uniqCharact[row.characteristic_id] = {};

			characteristicsForVariant.push({
				characteristic_id: row.characteristic_id,
				option: [row.case_id, row.title]
			});
		});

		return characteristicsForVariant;
	}

	setParamsDiff(val) {
		this.paramsDiff = val;

		return this;
	}
}