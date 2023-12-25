import Component from '../../../../../../modules/component';
import _ from 'underscore';
// import SphinxProductIndexer from '../../../../../system/modules/sphinx/productIndexer';

export default class Saver extends Component {
	constructor(env) {
		super(env);

		this.product = null;
		this.charactForSave = null;
		this.variantsForSave = null;
	}

	async save() {
		await this.saveCharacteristics();
		await this.createVariants();

		// const indexer = new SphinxProductIndexer(this.getEnv());
		// await indexer.reIndexProduct(this.product.product_id);
	}

	async createVariants() {
		for (const casesIndexes of this.variantsForSave) {
			let casesList = this.getCasesForVariant(casesIndexes);
			await this.createVariant(casesList);
		}
	}

	async createVariant(casesList) {
		let idList = _.pluck(casesList, 'id');

		let variantRow = await this.getModel('variant').findVariantByCases(this.product.product_id, idList);

		if (variantRow)
			return;

		//NOTE: cases will be filled by trigger, do not fill it manually
		variantRow = await this.getModel('variant').create({
			product_id: this.product.product_id,
		});

		for (const caseRow of casesList) {
			await this.getModel('characteristicVariantVal').create({
				variant_id: variantRow.variant_id,
				characteristic_id: caseRow.characteristicId,
				case_id: caseRow.id,
				rel_type: 'variant'
			});
		}

		const [inventoryItem] = await this.getDb()
			.sql('select * from vw_inventory_item where variant_id = :variant and type = :type limit 1', {
				variant: variantRow.variant_id,
				type: 'variant'
			})
		;

		if (inventoryItem && !inventoryItem.track_inventory) {
			await this.getModel('inventoryItem').updateItemsQty([inventoryItem.item_id], 1);
		}
	}

	getCasesForVariant(casesIndexes) {
		return casesIndexes.reduce((out, row) => {
			if (
				row.charactKey in this.charactForSave
				&&
				row.caseKey in this.charactForSave[row.charactKey].cases
			) {
				out.push(Object.assign(this.charactForSave[row.charactKey].cases[row.caseKey], {
					characteristicId: this.charactForSave[row.charactKey].id
				}));

				return out;
			} else {
				throw new Error(`Cannot find characteristic in charactForSave: ${row.charactKey} - ${row.caseKey}`);
			}
		}, []);
	}

	async saveCharacteristics() {
		//list of characteristics id, which should not be removed:
		let actualCharacteristics = [];

		for (const key of Object.keys(this.charactForSave)) {
			const characteristic = this.charactForSave[key];

			if (characteristic.relatedTo == 'product') {
				if (characteristic.id) {
					await this.updateCharacteristic(characteristic);
				} else {
					await this.createCharacteristic(characteristic);
				}
			}

			actualCharacteristics.push(characteristic.id);

			await this.setProductVariantCharacteristicRel(characteristic);
		}

		await this.removeUnusedCharacteristics(actualCharacteristics);
	}

	removeUnusedCharacteristics(actualCharacteristics) {
		return this.getDb().sql(`
			delete from
				characteristic
			where
				characteristic_id in (
					select
						characteristic_id
					from
						product_variant_characteristic
						inner join characteristic using(characteristic_id)
					where
						product_id = :product
						and rel_type = 'variant'
						and group_id is null
				)
				and characteristic_id not in (${this.getDb().escapeIn(actualCharacteristics)})
				and characteristic_id not in (
					select
						characteristic_id
					from
						characteristic_variant_val
				)
		`, {
			product: this.product.product_id
		});
	}

	async updateCharacteristic(characteristic) {
		let langId = this.getEditingLang().lang_id;

		await this.getModel('characteristicText').update({
			title: characteristic.title
		}, {
			where: {
				characteristic_id: characteristic.id,
				lang_id: langId
			}
		});

		await this.saveCharacteristicCases(characteristic);
		await this.removeUnusedCases(characteristic);
	}

	removeUnusedCases(characteristic) {
		let actualCases = [];
		Object.keys(characteristic.cases).forEach((i) => {
			actualCases.push(characteristic.cases[i].id);
		});

		return this.getDb().sql(`
			delete from
				characteristic_type_case
			where
				case_id not in (${this.getDb().escapeIn(actualCases)})
				and case_id not in (
					select
						case_id
					from
						characteristic_variant_val
					where
						characteristic_id = :characteristicId
				)
				and characteristic_id = :characteristicId
		`, {
			characteristicId: characteristic.id
		});
	}

	async createCharacteristic(characteristic) {
		let row = await this.getModel('characteristic').createCharacteristic(
			null,
			null,
			'checkbox',
			characteristic.title,
			this.getEditingLang().lang_id
		);
		characteristic.id = row.characteristic_id;

		return this.saveCharacteristicCases(characteristic);
	}

	setProductVariantCharacteristicRel(characteristic) {
		return this.getDb().sql(`
			insert into product_variant_characteristic
				(product_id, characteristic_id, rel_type)
			values
				(:product, :characteristic, :type)
			on conflict do nothing
		`, {
			product: this.product.product_id,
			characteristic: characteristic.id,
			type: 'variant'
		});
	}

	async saveCharacteristicCases(characteristic) {
		const langId = this.getEditingLang().lang_id;

		for (const caseKey of Object.keys(characteristic.cases)) {
			let caseVals = characteristic.cases[caseKey];

			if (caseVals.id) {
				await this.getModel('characteristicTypeCaseText').update({
					title: caseVals.title
				}, {
					where: {
						case_id: caseVals.id,
						lang_id: langId
					}
				});
			} else {
				let row = await this.getModel('characteristic').createCase(
					characteristic.id,
					langId,
					characteristic.cases[caseKey].title
				);
				characteristic.cases[caseKey].id = row.case_id;
			}
		}
	}

	setProduct(product) {
		this.product = product;

		return this;
	}

	setCharactForSave(charactForSave) {
		this.charactForSave = charactForSave;

		return this;
	}

	setVariantsForSave(variantsForSave) {
		this.variantsForSave = variantsForSave;

		return this;
	}
}