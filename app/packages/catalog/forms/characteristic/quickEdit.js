import CharacteristicForm from './characteristic';

export default class CharacteristicQuickEdit extends CharacteristicForm {
	constructor(options = {}) {
		super(options);

		this.productId = options.productId;
		this.productCharacteristics = null;

		if (!this.productId) {
			throw new Error('ProductId must be psecified to be able to reload characteristics.');
		}
	}

	getRules() {
		let rules = [
			['title, alias', 'required'],
			['case, isCaseNew, default_value, caseSort, help', 'safe'],
			['alias', 'jsonKey'],
			['alias', 'isUnique', {
				field: 'alias',
				row: this.record ? this.record : null,
				model: this.getModel('characteristic')
			}],
			['help', 'trim']
		];

		if (!this.isInVariant) {
			rules = rules.concat([
				['type', 'required'],
				['type', 'inOptions', {options: 'type'}],
			]);
		}

		return rules;
	}

	async getTplData() {
		const data = await super.getTplData();

		data.hasParentField = false;
		data.productId = this.productId;

		return data;
	}

	async save() {
		await this.saveBasicAttrs();
		await this.saveCases();
		//we need to reload characteristics in frontend, so load it:
		await this.loadProductCharacteristics();
	}

	async loadProductCharacteristics() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/productCharacteristic', {}, {
			productId: this.pk,
			groupId: this.groupId
		});

		this.productCharacteristics = await dataProvider.getData();
	}

	getProductCharacteristics() {
		return this.productCharacteristics;
	}
}