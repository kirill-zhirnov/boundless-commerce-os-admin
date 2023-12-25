import Form from '../../../../../modules/form/index';
import _ from 'underscore';
import validator from 'validator';
import Saver from './createMulti/saver';
import helpCatalog from '../../../../../modules/help';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class CreateMultipleVariants extends Form {
	constructor(options) {
		super(options);

		this.productId = options.productId;
		this.groupId = options.groupId;
		if (!this.productId || !this.groupId)
			throw new Error('ProductId and GroupId must be passed!');

		this.product = null;

		this.groupCharacteristics = [];
		this.groupCharacteristicKeys = {};

		this.productCharacteristics = [];
		this.productCharacteristicKeys = {};

		this.charactForSave = {};
		this.variantsForSave = [];
	}

	getRules() {
		return [
			['id', 'validateCharacteristics'],
			['variant', 'validateVariants'],
			['title, case_id, case_title, is_used', 'safe']
		];
	}

	async save() {
		const env = await this.getEnv();

		const saver = new Saver(env);
		saver
			.setProduct(this.product)
			.setCharactForSave(this.charactForSave)
			.setVariantsForSave(this.variantsForSave)
			;

		await saver.save();

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.productId
		);
	}

	validateCharacteristics() {
		this.charactForSave = {};

		if (!_.isObject(this.attributes.id) || !this.attributes.id)
			return;

		Object.keys(this.attributes.id).forEach((key) => {
			let index = key.replace(/^c_/, '');

			if (this.attributes.relatedTo[key] == 'group') {
				this.validateGroupCharact(key, index);
			} else {
				this.validateProductCharact(key, index);
			}
		});
	}

	validateProductCharact(key, index) {
		let id = this.attributes.id[key];

		if (id && !(id in this.productCharacteristicKeys))
			return;

		let characteristic = {
			id: id,
			relatedTo: 'product',
			title: validator.trim(this.attributes.title[key]),
			cases: {},
		};

		if (characteristic.title == '')
			return;

		let caseIds = this.attributes.case_id[key],
			caseTitles = this.attributes.case_title[key],
			cases = {}
			;

		if (!caseIds || !caseTitles)
			return;

		Object.keys(caseIds).forEach((caseKey) => {
			let caseRow = {
				id: caseIds[caseKey],
				title: validator.trim(caseTitles[caseKey])
			};

			if (caseRow.title == '')
				return;

			let caseIndex = caseKey.replace(/^j_/, '');
			cases[caseIndex] = caseRow;
		});

		if (!Object.keys(cases).length)
			return;

		characteristic.cases = cases;
		this.charactForSave[index] = characteristic;
	}

	validateGroupCharact(key, index) {
		if (this.attributes.is_used[key] != '1')
			return;

		let id = this.attributes.id[key];
		if (!(id in this.groupCharacteristicKeys))
			return;

		let characteristic = {
			id: id,
			relatedTo: 'group',
			cases: {}
		};

		let caseIds = this.attributes.case_id[key],
			cases = {},
			characteristicRow = this.groupCharacteristics[this.groupCharacteristicKeys[id]]
			;

		if (!caseIds)
			return;

		Object.keys(caseIds).forEach((caseKey) => {
			let caseRow = characteristicRow.cases.find((row) => {
				if (caseIds[caseKey] == row.id)
					return true;
			});

			if (!caseRow)
				return;

			let caseIndex = caseKey.replace(/^j_/, '');
			cases[caseIndex] = caseRow;
		});

		if (!Object.keys(cases).length)
			return;

		characteristic.cases = cases;
		this.charactForSave[index] = characteristic;
	}

	validateVariants() {
		let variants = this.attributes.variant;

		if (!variants || !Array.isArray(variants)) {
			this.addError('variant_errors', 'variant', 'At least variant have to be selected.');
			return;
		}


		variants.forEach((row) => {
			let cases = row.split('X'),
				variant = []
				;

			cases.forEach((caseAlias) => {
				let res = caseAlias.match(/^case_(\d+)_(\d+)$/);

				if (!res)
					return;

				let charactKey = res[1],
					caseKey = res[2]
					;
				// console.log(res, charactKey, caseKey);
				if (!this.charactForSave[charactKey] || !this.charactForSave[charactKey].cases[caseKey]) {
					this.addError('variant_errors', 'variant', 'Characteristic and cases have to be filled to use in variants.');
					return;
				}

				variant.push({
					charactKey,
					caseKey
				});
			});

			if (variant.length) {
				this.variantsForSave.push(variant);
			}
		});
	}

	async getTplData() {
		const data = await super.getTplData();

		Object.assign(data, {
			groupCharacteristics: this.groupCharacteristics,
			productCharacteristics: this.productCharacteristics,
			groupId: this.groupId,
			product: this.product,
			help: helpCatalog.get('howToCreateVariant')
		});

		return data;
	}

	async setup() {
		await super.setup();
		await this.setupProduct();
		await this.setupCommodityGroupCharacteristics();
		await this.setupProductCharacteristics();
	}

	async setupProductCharacteristics() {
		const rows = await this.getDb().sql(`
			select
				c.characteristic_id,
				c.type,
				c.alias,
				ct.title,
				ct.help,
				caseType.case_id,
				caseText.title as case_title
			from
				product_variant_characteristic pvc
				inner join characteristic c on c.characteristic_id = pvc.characteristic_id
				inner join characteristic_text ct on c.characteristic_id = ct.characteristic_id and ct.lang_id = :langId
				left join characteristic_type_case caseType on caseType.characteristic_id = c.characteristic_id
				left join characteristic_type_case_text caseText on caseType.case_id = caseText.case_id and caseText.lang_id = :langId
			where
				pvc.product_id = :productId
				and c.group_id is null
				and pvc.rel_type = 'variant'
			order by
				c.sort asc,
				caseType.case_id asc
		`, {
			productId: this.product.product_id,
			langId: this.getEditingLang().lang_id
		});

		this.setupCharacteristicsInVars(rows, 'productCharacteristics', 'productCharacteristicKeys', 'product');
	}

	async setupCommodityGroupCharacteristics() {
		const rows = await this.getDb().sql(`
			select
				c.characteristic_id,
				c.type,
				c.alias,
				ct.title,
				ct.help,
				caseType.case_id,
				caseText.title as case_title,
				pVal.case_id as value_case,
				vc.rel_id as used_in_variants
			from
				characteristic c
				inner join characteristic_text ct on c.characteristic_id = ct.characteristic_id and ct.lang_id = :langId
				left join characteristic_type_case caseType on caseType.characteristic_id = c.characteristic_id
				left join characteristic_type_case_text caseText on caseType.case_id = caseText.case_id and caseText.lang_id = :langId
				left join characteristic_product_val pVal on
					pVal.characteristic_id = c.characteristic_id
					and pVal.product_id = :productId
					and (pVal.case_id = caseType.case_id or pVal.case_id is null)
				left join product_variant_characteristic vc on
					vc.characteristic_id = c.characteristic_id
					and vc.product_id = :productId
					and vc.rel_type = 'variant'
			where
				c.group_id = :groupId
				and c.type = 'checkbox'
			order by
				c.sort asc,
				caseType.sort asc
		`, {
			langId: this.getEditingLang().lang_id,
			groupId: this.groupId,
			productId: this.productId
		});
		this.setupCharacteristicsInVars(rows, 'groupCharacteristics', 'groupCharacteristicKeys', 'group');
	}

	setupCharacteristicsInVars(rows, characteristicsKey, relKey, relatedTo = null) {
		rows.forEach((row) => {
			let key;

			if (!(row.characteristic_id in this[relKey])) {
				row.relatedTo = relatedTo;

				this[characteristicsKey].push(
					_.extend(
						_.pick(row, [
							'characteristic_id',
							'type',
							'alias',
							'title',
							'help',
							'relatedTo',
							'used_in_variants'
						])
						, {
							cases: []
						}
					)
				);

				key = this[characteristicsKey].length - 1;
				this[relKey][row.characteristic_id] = key;
			} else {
				key = this[relKey][row.characteristic_id];
			}

			if (row.case_id) {
				this[characteristicsKey][key].cases.push({
					id: row.case_id,
					title: row.case_title
				});
			}
		});
	}

	async setupProduct() {
		//@ts-ignore
		const row = await this.getModel('product').findException({
			include: [{
				model: this.getModel('productText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				product_id: this.productId
			}
		});
		this.product = row;

		return row;
	}
}