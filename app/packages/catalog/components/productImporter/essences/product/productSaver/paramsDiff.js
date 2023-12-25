import BasicSaver from '../basic';
import validator from '../../../../../../../modules/validator/validator';

export default class ParamsDiff extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.productParams = null;
		this.paramsDiffForVariant = null;
	}

	async isParamsEqual() {
		const diff = await this.getParamsDiffForVariant();
		if (Object.keys(diff).length > 0) return false;

		return true;
	}

	async getProductParams() {
		if (!this.productParams) {
			this.productParams = await this.loadProductParams();
		}

		return this.productParams;
	}

	async getParamsDiffForVariant() {
		if (!this.paramsDiffForVariant) {
			this.paramsDiffForVariant = await this.generateParamsDiffForVariant();
		}

		return this.paramsDiffForVariant;
	}

	async generateParamsDiffForVariant() {
		const productParams = await this.getProductParams();
		let importingParams = this.generateImportingParams();
		let diff = {};

		Object.keys(importingParams).forEach((paramName) => {
			/*
			if an importing param has multi-values - it can't be used for variant creation.
			 */
			if (importingParams[paramName].length != 1)
				return;

			if (!(paramName in productParams)) {
				diff[paramName] = importingParams[paramName];
				return;
			}

			/*
			don't compare characteristics, which are not a multi value,
			since they can't be used for variant creation
			 */
			if (!this.db.model('characteristic').isTypeMultipleValue(productParams[paramName].type))
				return;

			let impValue = importingParams[paramName][0];
			if (productParams[paramName].values.indexOf(impValue) == -1) {
				diff[paramName] = importingParams[paramName];
				return;
			}
		});

		return diff;
	}

	async loadProductParams() {
		const rows = await this.db.model('product')
			.loadCharacteristicValues(this.product.product_id, this.product.group_id, this.lang.lang_id);

		let out = {};

		rows.forEach((item) => {
			let title = validator.trim(String(item.title).toLowerCase());

			if (!out[title])
				out[title] = {
					characteristic_id: item.characteristic_id,
					type: item.type,
					values: []
				};

			let values = item.value.map((val) => {
				return validator.trim(String(val).toLowerCase());
			});

			out[title].values = out[title].values.concat(values);
		});

		return out;
	}

	generateImportingParams() {
		let out = {};

		this.dataRow.params.forEach((item) => {
			if (!item.name || !item.value)
				return;

			let name = validator.trim(String(item.name).toLowerCase());

			if (!out[name])
				out[name] = [];

			out[name].push(validator.trim(String(item.value).toLowerCase()));
		});

		return out;
	}
}