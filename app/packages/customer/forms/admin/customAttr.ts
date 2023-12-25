import Form from '../../../../modules/form';
import validator from '../../../../modules/validator/validator';
import {TPersonAttrHtmlType} from '../../../../@types/person';
import {IPersonAttrsModel, IPersonAttrsModelStatic} from '../../models/personAttrs';

interface IOptions {
	id: string;
	title: string;
}

interface IOptionsInput {
	ids: string[];
	titles: string[];
}

interface IAttrs {
	title: string|null;
	key: string|null;
	type: TPersonAttrHtmlType|null;
	options: IOptions[];
	hint: string|null;
	sort: number|null;
}

export default class CustomAttrSetupForm extends Form<IAttrs, IPersonAttrsModel> {
	getRules() {
		return [
			['title, key, type', 'required'],
			['title', 'isUnique', {
				field: 'title',
				row: this.record,
				model: this.getModel('personAttrs')
			}],
			['key', 'validateKey'],
			['key', 'isUnique', {
				field: 'key',
				row: this.record,
				model: this.getModel('personAttrs')
			}],
			['type', 'inOptions', {options: 'type'}],
			['options', 'validateOptions'],
			['hint', 'trim'],
			['sort', 'isNum']
		];
	}

	async save() {
		if (!this.record) {
			this.record = (this.getModel('personAttrs') as IPersonAttrsModelStatic).build();
		}

		const attrs = this.getSafeAttrs();
		this.record.set({
			title: attrs.title,
			key: attrs.key,
			type: attrs.type,
			options: attrs.options,
			hint: attrs.hint
		});

		if (this.record.isNewRecord) {
			const [{sort}] = await this.getDb().sql<{sort: number}>('select coalesce(max(sort), 0) + 10 as sort  from person_attrs');
			this.record.sort = sort;
		} else {
			this.record.sort = attrs.sort;
		}

		await this.record.save();
	}

	validateOptions(options: IOptionsInput[]|any) {
		if (![TPersonAttrHtmlType.dropdown, TPersonAttrHtmlType.checkbox].includes(this.attributes.type)) {
			return;
		}

		const {ids, titles} = options || {};

		const rawValues = [];
		if (typeof ids === 'string' && typeof titles === 'string') {
			rawValues.push({
				id: ids,
				title: titles
			});
		} else if (Array.isArray(ids) && Array.isArray(titles) && ids.length === titles.length) {
			for (let i = 0; i < ids.length; i++) {
				rawValues.push({
					id: ids[i],
					title: titles[i]
				});
			}
		}

		const sanitizedValue: IOptions[] = [];
		for (const row of rawValues) {
			if (!row.id || !row.title) {
				continue;
			}

			if (validator.trim(row.title) == '' || validator.trim(row.id) == '') {
				continue;
			}

			sanitizedValue.push({
				id: row.id,
				title: row.title
			});
		}

		if (!sanitizedValue.length) {
			this.addError('type', 'optionsRequired', this.__('Options are empty. Please add at least one option.'));
			return;
		}

		this.attributes.options = sanitizedValue;
	}

	validateKey(value) {
		value = String(value);

		if (!/^[a-z0-9\-_]+$/i.test(value)) {
			this.addError('key', 'wrongSymbols', this.__('Allowed only alphanumeric symbols, symbols "-" and "_".'));
			return;
		}
	}

	rawOptions() {
		return {
			type: [
				['text', this.__('Text')],
				['text_area', this.__('Multi-line text (textarea)')],
				['checkbox', this.__('Checkbox(es)')],
				['dropdown', this.__('Dropdown')],
			]
		};
	}

	async loadRecord(): Promise<IPersonAttrsModel> {
		return await (this.getModel('personAttrs') as IPersonAttrsModelStatic).findException({
			where: {
				attr_id: this.pk
			}
		}) as IPersonAttrsModel;
	}
}