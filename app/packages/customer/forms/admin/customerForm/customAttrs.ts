import Form from '../../../../../modules/form';
import {IPersonAttrsModel, IPersonAttrsModelStatic} from '../../../models/personAttrs';
import {IPersonModel} from '../../../models/person';

interface IAttrs {
	values: {
		[key: string]: any;
	}
}

export default class PersonCustomAttrs extends Form<IAttrs> {
	protected person?: IPersonModel;
	protected customAttrs: IPersonAttrsModel[] = [];
	protected customAttrsByKeys: {[key: string]: IPersonAttrsModel} = {};

	getRules() {
		return [
			['values', 'validateValues']
		];
	}

	async setup() {
		await super.setup();

		this.customAttrs = await (this.getModel('personAttrs') as IPersonAttrsModelStatic).findAll({
			order: [
				['sort', 'asc']
			]
		});

		this.customAttrsByKeys = {};
		for (const attrRow of this.customAttrs) {
			this.customAttrsByKeys[attrRow.key] = attrRow;
		}
	}

	async save() {
		const profile = this.person.personProfile!;
		const attrs = this.getSafeAttrs();

		if (profile.custom_attrs === null) {
			profile.custom_attrs = {};
		}

		profile.custom_attrs = Object.assign({}, profile.custom_attrs, attrs.values);
		await profile.save();
	}

	validateValues(value) {
		const sanitizedValues = {};
		for (const attrRow of this.customAttrs) {
			sanitizedValues[attrRow.key] = null;

			if (value && attrRow.key in value) {
				sanitizedValues[attrRow.key] = value[attrRow.key];
			}
		}

		this.attributes.values = sanitizedValues;
	}

	setPersonRecord(person: IPersonModel) {
		this.person = person;
	}
}