import BasicSaver from './basic';
import _ from 'underscore';
import ParamsDiff from './productSaver/paramsDiff';

/**
 * Class needs to search product and detect scenario. The class always returns product, if it is
 * not found - a product will be created.
 *
 * The scenario can be:
 * - createProduct
 * - updateProduct
 * - updateVariant
 * - appendVariant
 */
export default class ProductSearcher extends BasicSaver {
	/**
	 * @param {Object} instanceRegistry - The instance registry
	 * @param {Object} logger - instance of ImportLogger: @p-catalog/productImporter/importLogger.
	 * @param {Object} dataRow - a data with importing row, e.g. object data from YML parser or CSV parser
	 */
	constructor(instanceRegistry, logger, dataRow) {
		super(instanceRegistry, logger, null, dataRow);

		/**
		 * @type {ParamsDiff} instance
		 */
		this.paramsDiff = null;
	}

	/**
	 * The entry point for the class.
	 *
	 * @returns {Promise} If success it resolves with {scenario:<String>,product:<AR>,variant:<AR>}
	 */
	async process() {
		await this.setup();
		await this.findProduct();

		if (!this.product)
			await this.createProduct();

		if (!this.scenario) {
			if (this.variant) {
				this.scenario = 'updateVariant';
			} else {
				await this.processAppendVariant();
			}
		}

		return {
			scenario: this.scenario,
			product: this.product,
			variant: this.variant
		};
	}

	setup() {
		return this.setupI18n();
	}

	async processAppendVariant() {
		const result = await this.shallAppendVariant();
		if (result) {
			this.scenario = 'appendVariant';
		} else {
			this.scenario = 'updateProduct';
		}
	}

	/**
	 * Check - shall append variant to existance product (this.product).
	 */
	async shallAppendVariant() {
		if (
			!this.import.settings.detect_variants_by
			|| !Array.isArray(this.dataRow.params)
			|| !this.dataRow.params.length
		)
			return false;

		let shallAppendVariant = false;
		switch (this.import.settings.detect_variants_by) {
			case 'sku':
				if (this.dataRow.sku
					&& this.product.sku == this.dataRow.sku
				)
					shallAppendVariant = true;
				break;
			case 'offerGroupId':
				if (this.dataRow.offerGroupId
					&& this.product.productProp
					&& this.product.productProp.extra
					&& this.product.productProp.extra.offerGroupId == this.dataRow.offerGroupId
				)
					shallAppendVariant = true;
				break;
		}

		if (!shallAppendVariant)
			return false;

		const result = await this.isParamsEqual();
		return !result;
	}

	isParamsEqual() {
		this.paramsDiff = this.makeChildSaver(ParamsDiff);
		return this.paramsDiff.isParamsEqual();
	}

	createProduct() {
		this.scenario = 'createProduct';

		return;
	}

	async findProduct() {
		let product, variant;

		const res = await this.findProductBySKUOrId();
		if (res && res.product) {
			({product, variant} = res);

			return false;
		} else {
			const _res = await this.findProductByOfferGroupId();
			if (_res) {
				({product, variant} = res);
			}
		}

		if (product) {
			this.product = await this.db.model('product').findOne({
				include: [
					{
						model: this.db.model('productProp')
					}
				],
				where: {
					product_id: product.product_id
				}
			});

			this.variant = variant
				? await this.db.model('variant').findOne({
					where: {
						variant_id: variant.variant_id
					}
				})
				: null;
		}
	}

	async findProductByOfferGroupId() {
		if (!this.dataRow.offerGroupId) return;

		const rows = await this.db.sql(`
			select
				product_id
			from
				product_prop
			where
				extra @> :offerCond
			limit 1
		`, {
			offerCond: JSON.stringify({offerGroupId: this.dataRow.offerGroupId})
		});

		let out = {
			product: null,
			variant: null
		};

		if (rows.length) {
			out.product = rows[0];
		}

		return out;
	}

	async findProductBySKUOrId() {
		let where = _.pick(this.dataRow, ['sku', 'external_id']);

		if (_.isEmpty(where)) return;

		let product, variant;

		_.defaults(where, {
			sku: null,
			external_id: null
		});

		const rows = await this.db.sql(`
			select
				product_id,
				has_variants
			from
				product
			where
				sku = :sku
				or external_id = :external_id
		`, where);

		let results;

		if (rows.length) {
			product = rows[0];

			if (product.has_variants)
				results = await this.db.sql(`
						select
							*
						from
							variant
						where
							product_id = :product_id
							and (
								sku = :sku
								or sku = :external_id
							)

					`, Object.assign({
					product_id: product.product_id
				}, where));
		} else {
			results = await this.db.sql(`
					select
						*
					from
						variant
					where
						sku = :sku
						or sku = :external_id
				`, where);
		}

		if (results && results.length) {
			variant = results[0];
			product = {
				product_id: variant.product_id,
				has_variants: true
			};
		}

		return {
			product: product,
			variant: variant
		};
	}

	getParamsDiff() {
		return this.paramsDiff;
	}
}