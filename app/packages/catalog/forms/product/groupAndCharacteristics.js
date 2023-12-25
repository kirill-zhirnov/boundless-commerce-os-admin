import BasicForm from './basic';
import _ from 'underscore';
import validator from '../../../../modules/validator/validator';
import CompileCharacteristic from '../../modules/compileCharacteristic';
import help from '../../../../modules/help';

export default class GroupAndCharacteristicsForm extends BasicForm {
	constructor(options) {
		super(options);

		this.characteristics = null;
		this.affectedCharacteristics = [];
	}

	getRules() {
		return [
			['characteristic', 'validateCharacteristics'],
			['group_id', 'safe']
		];
	}

	async save() {
		//@ts-ignore
		const {characteristic} = this.getSafeAttrs();

		//@ts-ignore
		for (const id of Object.keys(characteristic)) {
			if (!(id in this.characteristics))
				continue;

			//@ts-ignore
			const value = characteristic[id];
			if (this.characteristics[id].isCaseValue()) {
				await this.saveCaseValue(id, value);
			} else {
				await this.saveTextValue(id, value);
			}
		}

		//clear characteristics values which wasn't in POST
		let where = '';
		if (this.affectedCharacteristics.length > 0) {
			where = `and characteristic_id not in (${this.getDb().escapeIn(this.affectedCharacteristics)})`;
		}

		await this.getDb().sql(`
			delete from characteristic_product_val
			where
				product_id = :product
				and case_id is not null
				${where}
		`, {
			//@ts-ignore
			product: this.record.product_id
		});
		const env = await this.getEnv();
		//@ts-ignore
		const compileCharacteristic = new CompileCharacteristic(env, this.record.product_id);
		await compileCharacteristic.compile();
	}

	async saveCaseValue(characteristicId, value) {
		this.affectedCharacteristics.push(characteristicId);

		const affectedCases = [];

		for (const caseId of value) {
			affectedCases.push(caseId);
			await this.getDb().sql(`
				insert into characteristic_product_val
					(product_id, characteristic_id, case_id)
				values
					(:product, :characteristic, :caseId)
				on conflict do nothing
			`, {
				//@ts-ignore
				product: this.record.product_id,
				characteristic: characteristicId,
				caseId: caseId
			});
		}

		if (affectedCases.length > 0)
			await this.getDb().sql(`
					delete from characteristic_product_val
					where
						product_id = :product
						and characteristic_id = :characteristic
						and case_id not in (${this.getDb().escapeIn(affectedCases)})
				`, {
				//@ts-ignore
				product: this.record.product_id,
				characteristic: characteristicId
			});
	}

	async saveTextValue(characteristicId, value) {
		await this.getDb().sql(`
			insert into characteristic_product_val
				(product_id, characteristic_id)
			values
				(:product, :characteristic)
			on conflict do nothing
		`, {
			//@ts-ignore
			product: this.record.product_id,
			characteristic: characteristicId
		});

		await this.getDb().sql(`
			update characteristic_product_val_text
			set
				value = :value
			where
				lang_id = :lang
				and value_id in (
					select
						value_id
					from
						characteristic_product_val
					where
						product_id = :product
						and characteristic_id = :characteristic
				)
		`, {
			value: value,
			//@ts-ignore
			product: this.record.product_id,
			characteristic: characteristicId,
			lang: this.getEditingLang().lang_id
		});
	}

	async validateCharacteristics(value, options, attr) {
		// if (this.hasErrors('group_id'))
		// 	return;

		if (!_.isObject(value)) {
			this.attributes[attr] = {};
			return;
		}

		await this.loadCharacteristicsByGroup();
		Object.keys(value).forEach((id) => {
			if (!(id in this.characteristics))
				return;

			let characteristic = this.characteristics[id];
			let inputVal = value[id];

			if (characteristic.isCaseValue()) {
				if (!Array.isArray(inputVal))
					inputVal = [inputVal];

				inputVal = inputVal.map((val) => {
					return validator.trim(val);
				});
			} else {
				inputVal = validator.trim(inputVal);
			}

			switch (characteristic.system_type) {
				case 'length':
				case 'width':
				case 'height':
				case 'weight':
					if (inputVal != '') {
						let result = validator.isDotNumeric(inputVal);
						if (!result) {
							this.addError(`${attr}[${id}]`, 'onlyNumbers', this.__('String should contain only numbers.'));
							return;
						}

						inputVal = result;
					}
					break;
			}

			this.attributes[attr][id] = inputVal;
		});
	}

	async getTplData() {
		const data = await super.getTplData();

		const out = {
			characteristics: await this.loadCharacteristicsWithValues(),
			help: {
				addProp: help.get('addProp')
			}
		};

		return Object.assign(data, out);
	}

	rawOptions() {
		return {
			group: this.loadCommodityGroupOptions()
		};
	}

	async loadCommodityGroupOptions() {
		//@ts-ignore
		const options = await this.getModel('commodityGroup').fetchOptions(this.getEditingLang().lang_id);
		options.push(['create', this.__('+ Create new Product Type')]);

		return options;
	}

	async loadCharacteristicsWithValues() {
		//@ts-ignore
		if (!this.record.group_id) return null;

		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/productCharacteristic', {}, {
			productId: this.pk,
			//@ts-ignore
			groupId: this.record.group_id
		});
		const data = await dataProvider.getData();
		return data;
	}

	async loadCharacteristicsByGroup() {
		const group = await this.getModel('commodityGroup').findOne({
			include: [
				{
					model: this.getModel('characteristic')
				}
			],
			where: {
				//@ts-ignore
				group_id: this.record.group_id
			}
		});

		this.characteristics = {};

		//@ts-ignore
		if (group.characteristics) {
			//@ts-ignore
			group.characteristics.forEach((row) => {
				this.characteristics[row.characteristic_id] = row;
			});
		}
	}
}