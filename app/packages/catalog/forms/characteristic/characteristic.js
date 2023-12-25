import Form from '../../../../modules/form/index';
import _ from 'underscore';
import validator from '../../../../modules/validator/validator';

export default class Characteristic extends Form {
	constructor(options = {}) {
		super(options);

		this.caseItems = null;
		this.isInVariant = false;
		this.groupId = options.groupId;
	}

	getRules() {
		let rules = [
			['title, alias', 'required'],
			['parent_id', 'inOptions', {options: 'parent'}],
			['case, isCaseNew, default_value, caseSort, help', 'safe'],
			['alias', 'jsonKey'],
			['alias', 'isUnique', {
				field: 'alias',
				row: this.record ? this.record : null,
				model: this.getModel('characteristic')
			}],
			['parent_id', 'tree', {
				pk: 'characteristic_id',
				row: this.record
			}],
			['help', 'trim'],
			['sort', 'isNum']
		];

		if (!this.isInVariant) {
			rules = rules.concat([
				['type', 'required'],
				['type', 'inOptions', {options: 'type'}],
			]);
		}

		return rules;
	}

	getDefaultAttrs() {
		return {
			type: 'text'
		};
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('characteristic').findException({
			include: [
				{
					model: this.getModel('characteristicText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				},
				{
					model: this.getModel('characteristicTypeCase'),
					required: false,
					include: [
						{
							model: this.getModel('characteristicTypeCaseText'),
							required: false,
							where: {
								lang_id: this.getEditingLang().lang_id
							}
						}
					]
				},
				{
					model: this.getModel('characteristicProp')
				}
			],

			where: {
				characteristic_id: this.pk
			},

			order:  [
				[this.getModel('characteristicTypeCase'), 'sort', 'ASC']
			]
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		let attrs = Object.assign({}, _.pick(row, [
			'characteristic_id',
			'parent_id',
			'type',
			'system_type',
			'alias',
			'sort'
		]));
		Object.assign(attrs, _.pick(row.characteristicTexts[0], [
			'title',
			'help'
		]));

		let maxId = -1;
		this.caseItems = [];
		for (let typeCase of Array.from(row.characteristicTypeCases)) {
			maxId = Math.max(maxId, typeCase.case_id);

			this.caseItems.push({
				id: typeCase.case_id,
				value: typeCase.characteristicTypeCaseTexts[0].title,
				isNew: 0
			});
		}

		this.caseItems.push({
			id: ++maxId,
			value: '',
			isNew: 1
		});

		attrs = _.extend(attrs, _.pick(row.characteristicProp, ['default_value']));

		this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		await this.saveBasicAttrs();
		await this.saveCases();
		//@ts-ignore
		const prop = await this.record.getCharacteristicProp();
		prop.set(_.pick(attrs, ['default_value']));
		prop.is_folder = false;

		await prop.save();
	}

	async saveBasicAttrs() {
		const attrs = this.getSafeAttrs();
		const row = await this.getRecord() || this.getModel('characteristic').build();

		if (!this.isInVariant) {
			//@ts-ignore
			const prevType = row.type;
			//@ts-ignore
			row.type = attrs.type;

			//@ts-ignore
			if (this.isTextType(prevType) && !this.isTextType(attrs.type)) {
				//@ts-ignore
				await this.deleteCharacteristicFromProducts(row.characteristic_id);
			}
		}

		//@ts-ignore
		row.set(_.pick(attrs, ['system_type', 'parent_id']));
		row.alias = attrs.alias == '' ? null : attrs.alias;

		if (typeof attrs.sort !== 'undefined') {
			row.sort = attrs.sort;
		}

		//@ts-ignore
		if (row.isNewRecord) {
			//@ts-ignore
			row.group_id = this.getGroupId();
		}

		//@ts-ignore
		await row.save();

		//@ts-ignore
		this.setPk(row.characteristic_id);
		this.setRecord(row);

		await this.getModel('characteristicText').update({
			title: attrs.title,
			help: attrs.help == '' ? null : attrs.help
		}, {
			where: {
				//@ts-ignore
				characteristic_id: row.characteristic_id,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}


	async saveCases() {
		const attrs = this.getSafeAttrs();

		const processedCases = [];
		for (let i = 0; i < attrs.caseSort.length; i++) {
			const caseId = attrs.caseSort[i];
			let value = attrs.case[caseId];
			if (!(caseId in attrs.isCaseNew) || (caseId === 'tmp')) {
				continue;
			}

			value = validator.trim(value);
			if (value === '') {
				continue;
			}

			const sort = i * 10;
			const caseRow = attrs.isCaseNew[caseId] === '1'
				? await this.insertNewCase(value, sort)
				: await this.updateCase(caseId, value, sort);

			processedCases.push(caseRow);
		}

		const idList = _.invoke(processedCases, 'get', 'case_id');

		let sqlIdList = '';
		if (idList.length > 0) {
			sqlIdList = `and case_id not in (${this.getDb().escapeIn(idList)})`;
		}

		await this.getDb().sql(`
			delete
			from
				characteristic_type_case
			where
				characteristic_id = :characteristic
				${sqlIdList}
				and case_id not in (
					select
						case_id
					from
						characteristic_variant_val
					where
						characteristic_id = :characteristic
						and rel_type = 'variant'
				)
		`, {
			characteristic: this.pk
		});
	}

	async updateCase(caseId, value, sort) {
		await this.getModel('characteristicTypeCase').update({
			sort
		}, {
			where: {
				case_id: caseId
			}
		});

		const typeCase = this.getModel('characteristicTypeCase').findOne({
			where: {
				case_id: caseId
			}
		});

		if (typeCase) {
			const textRow = await this.findTextModel('characteristicTypeCaseText', {
				case_id: caseId,
				lang_id: this.getEditingLang().lang_id
			});
			if (textRow) {
				textRow.title = value;
				await textRow.save();
			}
		}

		return typeCase;
	}

	async insertNewCase(value, sort) {
		const row = this.getModel('characteristicTypeCase').build();
		row.set({
			//@ts-ignore
			characteristic_id: this.pk,
			sort
		});

		await row.save();

		const textRow = await this.findTextModel('characteristicTypeCaseText', {
			//@ts-ignore
			case_id: row.case_id,
			lang_id: this.getEditingLang().lang_id
		});

		textRow.title = value;
		await textRow.save();

		return row;
	}

	rawOptions() {
		return {
			type: [
				['text', this.p__('charact', 'Text')],
				['textarea', this.p__('charact', 'Textarea')],
				['wysiwyg', this.p__('charact', 'WYSIWYG editor')],
				['checkbox', this.p__('charact', 'Checkbox')],
				['radio', this.p__('charact', 'Radio buttons')],
				['select', this.p__('charact', 'Dropdown list')]
			],

			//@ts-ignore
			parent: this.getModel('characteristic').findFolderOptions(this.getGroupId(), this.getEditingLang().lang_id)
		};
	}

	getGroupId() {
		if (!this.groupId) {
			throw new Error('You must specify @groupId before calling this func!');
		}

		return this.groupId;
	}

	async getTplData() {
		const data = await super.getTplData();

		Object.assign(data, {
			caseItems: this.caseItems,
			isInVariant: this.isInVariant,
			hasParentField: true,
			groupId: this.getGroupId(),
			showSort: true
		});

		return data;
	}

	async setup() {
		await super.setup();

		if (!this.pk) {
			this.caseItems = [];
			this.caseItems.push({
				id: 1,
				value: '',
				isNew: 1
			});
		}

		if (this.record) {
			const variantValRow = await this.getModel('characteristicVariantVal').findOne({
				where: {
					//@ts-ignore
					characteristic_id: this.record.characteristic_id,
					rel_type: 'variant'
				}
			});
			if (variantValRow) this.isInVariant = true;
		}
	}

	isTextType(type) {
		if (['text', 'textarea', 'wysiwyg'].includes(type)) {
			return true;
		} else {
			return false;
		}
	}

	async deleteCharacteristicFromProducts(charId) {
		await this.getDb().model('characteristicProductVal').destroy({
			where: {
				characteristic_id: charId
			}
		});
	}
}