import Form from '../../../../modules/form/index';
import _ from 'underscore';
import {Op} from 'sequelize';

export default class System extends Form {
	constructor(options) {
		super(options);

		this.groupId = options.groupId;
		this.isInVariant = false;
	}

	getRules() {
		const rules = [
			//			['system_type', 'inOptions', {options:'systemType'}],
			//			['system_type', 'validateUniqueSystemType'],
			['alias', 'isUnique', {
				field: 'alias',
				row: this.record ? this.record : null,
				model: this.getModel('characteristic')
			}],
			// ['is_hidden', 'safe'],
			['sort', 'isNum']
		];

		//		if !@isInVariant
		//			rules = rules.concat [
		//				['system_type', 'validateTypeBySystemType']
		//			]

		return rules;
	}

	async setup() {
		await super.setup();

		if (!this.record) return;

		const variantValRow = await this.getModel('characteristicVariantVal').findOne({
			where: {
				//@ts-ignore
				characteristic_id: this.record.characteristic_id,
				rel_type: 'variant'
			}
		});
		if (variantValRow) {
			this.isInVariant = true;
		}
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('characteristic').findException({
			include: [{
				model: this.getModel('characteristicProp')
			}],
			where: {
				characteristic_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();
		const attrs = _.pick(row, ['alias', 'sort']);

		// attrs = _.extend(attrs, _.pick(row.characteristicProp, ['is_hidden']));
		// this.booleanToStr(attrs, ['is_hidden']);

		this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord();
		//			row.set _.pick(attrs, ['alias'])

		row.alias = attrs.alias;
		if (attrs.sort !== '') {
			//@ts-ignore
			row.sort = attrs.sort;
		}

		//@ts-ignore
		await row.save();

		// //@ts-ignore
		// const prop = await row.getCharacteristicProp();
		// prop.set(this.getBooleanAttrs(['is_hidden']));
		//
		// await prop.save();
	}

	getGroupId() {
		if (!this.groupId) {
			throw new Error('You must specify group ID before calling this func!');
		}

		return this.groupId;
	}

	/*
	async validateUniqueSystemType(value, options, field) {
		//		list of system types, which allowed be only once per commodity group
		if (['length', 'width', 'height', 'weight'].indexOf(value) !== -1) {
			const findParams = {
				where: {
					group_id: this.getGroupId(),
					system_type: value
				}
			};

			if (this.record) {
				findParams.where['characteristic_id'] =
					//@ts-ignore
					{[Op.ne]: this.record.characteristic_id};
			}

			const row = await this.getModel('characteristic').findOne(findParams);
			if (row) {
				this.addError(field, 'notUnique', this.__('Characteristic with system type "%s" is already exist.', [value]));
			}
		}
	}*/

	rawOptions() {
		return {
			// systemType: [
			// 	['length', this.__('Length')],
			// 	['width', this.__('Width')],
			// 	['height', this.__('Height')],
			// 	['weight', this.__('Weight')]
			// ]
		};
	}

	// validateTypeBySystemType(value, options, field) {
	// 	const characteristicFormData = _.defaults(this.getController().getReqBody()['characteristic'], {});
	//
	// 	if (this.attributes.system_type === '') {
	// 		return;
	// 	}
	//
	// 	if (['text', 'textarea'].indexOf(characteristicFormData.type) === -1) {
	// 		this.addError(field, 'notAllowedForSystemType', this.__('If you specify system type, type can be only text or textarea.'));
	// 		return;
	// 	}
	// }
}