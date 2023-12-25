import Component from '../../../modules/component';

export default class CompileCharacteristic extends Component {
	constructor(env, productIdList) {
		super(env);

		this.productIdList = Array.isArray(productIdList) ? productIdList : [productIdList];
	}

	async compile() {
		const characteristics = await this.load();

		for (const productId of Object.keys(characteristics)) {
			await this.getModel('productProp').update({
				characteristic: characteristics[productId]
			}, {
				where: {
					product_id: productId
				}
			});
		}
	}

	async load() {
		let rows = await this.getDb().sql(`
			select
				distinct
				product_id,
				characteristic_id,
				characteristic.type,
				characteristic.alias,
				case_id,
				characteristic_product_val_text.value
			from
				characteristic_product_val
				inner join characteristic using(characteristic_id)
				inner join characteristic_product_val_text using(value_id)
			where
				product_id in (${this.getDb().escapeIn(this.productIdList)})
				and characteristic_product_val_text.lang_id = :lang
		`, {
			lang: this.getEditingLang().lang_id
		});

		let out = {};
		for (const row of rows) {
			if (!(row.product_id in out)) {
				out[row.product_id] = {};
			}

			//for some back-compatibilities
			const attrKey = row.alias || `characteristic_${row.characteristic_id}`;

			if (['checkbox', 'radio', 'select'].indexOf(row.type) != -1) {
				if (!(row.characteristic_id in out[row.product_id])) {
					out[row.product_id][attrKey] = [];
				}

				out[row.product_id][attrKey].push(row.case_id);
			} else {
				out[row.product_id][attrKey] = row.value;
			}
		}

		return out;
	}
}