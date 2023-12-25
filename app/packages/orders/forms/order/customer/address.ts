import Form from '../../../../../modules/form/index';
import {IPersonAddressModel, IPersonAddressModelStatic} from '../../../../customer/models/personAddress';
import {ICountryModelStatic} from '../../../../delivery/models/country';
import {IPersonModel} from '../../../../customer/models/person';
import {TAddressType} from '../../../../../@types/person';

interface IAttrs {
	company: string|null;
	address_line_1: string|null;
	address_line_2: string|null;
	city: string|null;
	state: string|null;
	zip: string|null;
	country_id: number|null;
}

export default class OrderAddressForm extends Form<IAttrs, IPersonAddressModel> {
	protected person?: IPersonModel;
	protected createNewAddress: boolean = false;
	protected personId: number|null;

	constructor(options) {
		super(options);
		this.personId = options.personId || null;
	}

	getRules() {
		return [
			['country_id', 'inOptions', {options: 'country'}],
			[
				'company,address_line_1,address_line_2,city,state,zip',
				'trim'
			]
		];
	}

	async save() {
		if (!this.createNewAddress || !this.addressFilled()) {
			return false;
		}

		if (!this.person) {
			throw new Error('Person must be set');
		}

		this.record = this.record || (this.getModel('personAddress') as IPersonAddressModelStatic).build({
			person_id: this.person.person_id,
			type: TAddressType.shipping
		});

		const attrs = this.getSafeAttrs();
		this.record.set({
			company: attrs.company,
			address_line_1: attrs.address_line_1,
			address_line_2: attrs.address_line_2,
			city: attrs.city,
			state: attrs.state,
			country_id: attrs.country_id,
			zip: attrs.zip,
		});
		await this.record.save();

		await (this.getModel('personAddress') as IPersonAddressModelStatic).checkIsDefaultExists(this.person.person_id);
	}

	async loadRecord(): Promise<IPersonAddressModel> {
		return await (this.getModel('personAddress') as IPersonAddressModelStatic).findOne({
			where: {
				type: TAddressType.shipping,
				person_id: this.personId
			}
		}) as IPersonAddressModel;
	}

	rawOptions() {
		return {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id)
		};
	}

	setPerson(person: IPersonModel) {
		this.person = person;
		return this;
	}

	setCreateNewAddress(value: boolean) {
		this.createNewAddress = value;
		return this;
	}

	addressFilled() {
		const {
			company, address_line_1, address_line_2, city, state, country_id, zip
		} = this.getSafeAttrs();

		if (
			company || address_line_1 || address_line_2 || city || state || country_id || zip
		) return true;

		return false;
	}
}