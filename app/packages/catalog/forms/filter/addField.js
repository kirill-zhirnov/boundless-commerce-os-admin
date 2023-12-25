import Form from '../../../../modules/form/index';
import _ from 'underscore';
import {Op} from 'sequelize';

export default class AddField extends Form {
	constructor(options) {
		super(options);

		this.filter = options.filter;
	}

	getRules() {
		return [
			['type', 'required'],
			['type', 'inOptions', {options: 'type'}],
			['type', 'validateOnUnique'],
			['type', 'validateCharacteristics'],
			['characteristic', 'safe']
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		if (this.isTypeCharacteristics(attrs.type)) {
			await this.saveCharacteristics();
		} else {
			await this.getModel('filterField').build().set({
				//@ts-ignore
				filter_id: this.filter,
				type: attrs.type
			}).save();
		}
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.filter = this.filter;

		return data;
	}

	rawOptions() {
		return {
			type: this.loadTypeOptions()
		};
	}

	async loadTypeOptions() {
		const out = [
			//			['category', @getI18n().__('Category')],
			['brand', this.__('Manufacturer')],
			['price', this.__('Price')],
			['availability', this.__('Is in stock?')],
		];

		//@ts-ignore
		const options = await this.getModel('commodityGroup').fetchOptions(this.getEditingLang().lang_id);

		out.push([this.__('Attributes from Product type:'), options]);

		return out;
	}

	validateCharacteristics(value, options, field) {
		if (this.hasErrors(field) || !this.isTypeCharacteristics(value)) {
			return true;
		}

		if (!_.isArray(this.attributes.characteristic) || (this.attributes.characteristic.length === 0)) {
			this.addError('type', 'noCharacteristics', this.getI18n().__('Please choose at least one characteristic.'));
		}

		return true;
	}

	async validateOnUnique(value, options, field) {
		if (this.hasErrors(field) || this.isTypeCharacteristics(value)) {
			return true;
		}

		const rows = await this.getDb().sql(`
			select
				field_id
			from
				filter_field
			where
				filter_id = :filter
				and type = :type
		`, {
			filter: this.filter,
			type: value
		});

		if (rows.length > 0) {
			this.addError(field, 'notUnique', this.__('Selected filter was already added.'));
		}

		return true;
	}

	isTypeCharacteristics(value) {
		return /^\d+$/.test(value);
	}

	async saveCharacteristics() {
		const FilterField = this.getModel('filterField');

		const otherFields = await FilterField.findAll({
			where: {
				filter_id: this.filter,
				type: {
					[Op.ne]: 'characteristic',
				}
			}
		});

		//@ts-ignore
		const notForRemove = otherFields.map((row) => row.field_id);
		for (const id of Array.from(this.getSafeAttr('characteristic'))) {
			const rowAttrs = {
				filter_id: this.filter,
				type: 'characteristic',
				characteristic_id: id
			};

			const [filterField] = await FilterField.findOrCreate({
				where: rowAttrs,
				//@ts-ignore
				default: rowAttrs
			});

			//@ts-ignore
			notForRemove.push(filterField.field_id);
		}

		const where = {
			filter_id: this.filter
		};

		if (notForRemove.length > 0) {
			where.field_id = {
				[Op.notIn]: notForRemove
			};
		}

		await FilterField.destroy({where});
	}
}