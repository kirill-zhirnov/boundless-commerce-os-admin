import BasicSaver from '../basic';
import _ from 'underscore';
import validator from '../../../../../../../modules/validator/validator';
import CompileCharacteristic from '../../../../../modules/compileCharacteristic';

export default class ProductCharacteristics extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.idCases = {};
		this.shallProcessItemClb = null;
	}

	/**
	 * @returns {Promise}
	 */
	async process() {
		if (!Array.isArray(this.dataRow.params))
			return;

		if (!this.scenario)
			throw new Error('You must setup scenario.');

		if (['createProduct', 'updateProduct'].indexOf(this.scenario) != -1)
			await this.db.model('characteristic').resetProductVals(this.product.product_id);
		await this.processParams();
		const env = await this.getEnv();

		const charactCompiler = new CompileCharacteristic(env, [this.product.product_id]);
		await charactCompiler.compile();
	}

	async processParams() {
		await this.ensureCharacteristicsExists();

		for (const characteristicId of Object.keys(this.idCases)) {
			let deleteOtherCases = false;

			if (['createProduct', 'updateProduct'].indexOf(this.scenario) != -1)
				deleteOtherCases = true;

			await this.db.model('characteristic').setCaseVals(
				this.product.product_id,
				characteristicId,
				this.idCases[characteristicId],
				deleteOtherCases
			);
		}
	}

	async ensureCharacteristicsExists() {
		for (const item of this.dataRow.params) {
			if (!item || !_.isObject(item)) continue;

			if (!('name' in item) || !('value' in item)) continue;

			item.name = validator.trim(String(item.name));
			item.value = validator.trim(String(item.value));

			if (_.isFunction(this.shallProcessItemClb)) {
				let res = this.shallProcessItemClb.call(this, item);
				if (!res) continue;
			}
			await this.processParam(item);
		}
	}

	async processParam(item) {
		const characteristic = await this.findOrCreateCharacteristic(item);

		if (characteristic.isTypeTextValue()) {
			await this.saveTextValue(characteristic, item);
		} else {
			await this.processCharacteristicCase(characteristic, item);
		}

	}

	async processCharacteristicCase(characteristic, item) {
		const caseId = await this.db.model('characteristic').findOrCreateCase(characteristic.characteristic_id, this.lang.lang_id, item.value);

		if (!Array.isArray(this.idCases[characteristic.characteristic_id]))
			this.idCases[characteristic.characteristic_id] = [];

		this.idCases[characteristic.characteristic_id].push(caseId);
	}

	saveTextValue(characteristic, item) {
		let value = item.value;

		if (characteristic.isDimensionsRelated())
			value = this.prepareNumberVal(value);

		return this.db.model('characteristic').setTextVal(
			this.product.product_id,
			characteristic.characteristic_id,
			this.lang.lang_id,
			value
		);
	}

	async findOrCreateCharacteristic(item) {
		const [row] = await this.db.sql(`
			select
				characteristic_id
			from
				vw_characteristic_grid
			where
				group_id = :group
				and lang_id = :lang
				and title = :title
				and is_folder is false
		`, {
			group: this.product.group_id,
			lang: this.lang.lang_id,
			title: item.name.toLowerCase()
		});

		if (row) {
			return await this.db.model('characteristic').findOne({
				where: {
					characteristic_id: row.characteristic_id
				}
			});
		} else {
			return await this.db.model('characteristic').createCharacteristic(this.product.group_id, null, 'checkbox', item.name, this.lang.lang_id);
		}
	}

	/**
	 * Returns characteristics and cases for dataRow: {characteristicIdA:[caseIdA,caseIdB],...}.
	 *
	 * @returns {{}}
	 */
	getIdCases() {
		return this.idCases;
	}

	setShallProcessItemClb(val) {
		this.shallProcessItemClb = val;

		return this;
	}
}