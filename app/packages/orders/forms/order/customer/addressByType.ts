import BasicForm, {IFormOptions, ITplData} from '../../../../../modules/form';
import {IPersonAddressModel, IPersonAddressModelStatic} from '../../../../customer/models/personAddress';
import {IPersonModel} from '../../../../customer/models/person';
import {IPerson, TAddressType} from '../../../../../@types/person';
import {ICountryModelStatic} from '../../../../delivery/models/country';
import * as eventNotification from '../../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';
import {IOrdersModelStatic} from '../../../models/orders';

interface IAttrs {
	first_name: string|null;
	last_name: string|null;
	company: string|null;
	address_line_1: string|null;
	address_line_2: string|null;
	city: string|null;
	state: string|null;
	country_id: number|null;
	zip: string|null;
	phone: string|null;
	comment: string|null;
}

export default class OrderAddressByType extends BasicForm<IAttrs, IPersonAddressModel> {
	protected person: IPersonModel;
	protected addressType: TAddressType;
	protected orderId: number;

	constructor(options: IFormOptions<IPersonAddressModel> & {person: IPersonModel, type: TAddressType, orderId: number}) {
		super(options);

		this.person = options.person;
		this.addressType = options.type;
		this.orderId = options.orderId;
	}

	getRules() {
		return [
			['country_id', 'inOptions', {options: 'country'}],
			['phone', 'isPhoneNumber'],
			['first_name', 'validateAddressFilled'],
			[
				'first_name,last_name,company,address_line_1,address_line_2,city,state,zip,comment',
				'trim'
			],
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		await this.record.set({
			first_name: attrs.first_name,
			last_name: attrs.last_name,
			company: attrs.company,
			address_line_1: attrs.address_line_1,
			address_line_2: attrs.address_line_2,
			city: attrs.city,
			state: attrs.state,
			country_id: attrs.country_id,
			zip: attrs.zip,
			phone: attrs.phone,
			comment: attrs.comment,
		}).save();

		await (this.getModel('personAddress') as IPersonAddressModelStatic).checkIsDefaultExists(this.person.person_id);

		//need to recalc - incase taxes depends on address
		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.orderId);

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.person.person_id
		);
	}

	async getRecord(): Promise<IPersonAddressModel> {
		if (this.record) {
			return this.record;
		}

		const PersonAddress = this.getModel('personAddress') as IPersonAddressModelStatic;
		const row = await PersonAddress.findOne({
			where: {
				person_id: this.person.person_id,
				type: this.addressType
			}
		});

		if (row) {
			this.record = row;
			this.scenario = 'update';
		} else {
			this.record = PersonAddress.build().set({
				person_id: this.person.person_id,
				type: this.addressType
			});
			this.scenario = 'insert';
		}

		return this.record;
	}

	async getTplData() {
		const data: ITplData<IAttrs> & {person?: IPerson, addressType?: TAddressType} = await super.getTplData();

		data.person = this.person.toJSON() as IPerson;
		data.addressType = this.addressType;

		return data;
	}

	rawOptions() {
		return {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id),
		};
	}

	validateAddressFilled() {
		const {
			first_name, last_name, company, address_line_1,
			address_line_2, city, state, country_id, zip, comment
		} = this.attributes;

		if (
			first_name || last_name || company || address_line_1 ||
			address_line_2 || city || state || country_id || zip || comment
		) return true;

		this.addError('first_name', 'required', this.__('Please fill at least one field.'));
		return false;
	}
}