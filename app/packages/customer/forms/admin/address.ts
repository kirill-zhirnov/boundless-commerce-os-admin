import Form, {IFormOptions} from '../../../../modules/form/index';
import {IPersonAddressModel, IPersonAddressModelStatic} from '../../models/personAddress';
import {TAddressType} from '../../../../@types/person';
import {ICountryModelStatic} from '../../../delivery/models/country';
import {Op} from 'sequelize';
import * as eventNotification from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

interface IAttrs {
	type: string|TAddressType|null;
	is_default: string|boolean|null;
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

export default class CustomerAddressForm extends Form<IAttrs, IPersonAddressModel> {
	protected personId: number;

	constructor(options: IFormOptions<IPersonAddressModel> & {personId: number}) {
		super(options);

		this.personId = options.personId;
	}

	getRules() {
		return [
			['type', 'required'],
			['country_id', 'inOptions', {options: 'country'}],
			['type', 'inOptions', {options: 'type'}],
			['phone', 'isPhoneNumber'],
			['type', 'validateType'],
			['is_default', 'safe'],
			[
				'first_name,last_name,company,address_line_1,address_line_2,city,state,zip,comment',
				'trim'
			]
		];
	}

	async save() {
		const PersonAddressModel = this.getModel('personAddress') as IPersonAddressModelStatic;
		if (!this.record) {
			this.record = PersonAddressModel.build({
				person_id: this.personId
			});
			await this.record.save();
		}

		const attrs = this.getSafeAttrs();
		const isDefault = attrs.is_default == '1';
		if (isDefault) {
			await PersonAddressModel.update({
				is_default: false
			}, {
				where: {
					person_id: this.personId
				}
			});
		}

		await PersonAddressModel.update({
			type: (attrs.type === 'other') ? null : attrs.type as TAddressType,
			is_default: isDefault,
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
		}, {
			where: {
				address_id: this.record.address_id
			}
		});

		await PersonAddressModel.checkIsDefaultExists(this.personId);

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.personId
		);
	}

	async setupAttrs() {
		await super.setupAttrs();

		if (this.record) {
			Object.assign(this.attributes, {
				type: this.record.type || 'other',
				is_default: this.record.is_default ? '1' : null
			});
		}
	}

	async validateType(value) {
		if (this.hasErrors('type') || value === 'other') {
			return;
		}

		const where = {person_id: this.personId, type: value};
		if (this.record && this.record.address_id) {
			Object.assign(where, {
				address_id: {
					[Op.ne]: this.record.address_id
				}
			});
		}

		const total = await (this.getModel('personAddress') as IPersonAddressModelStatic).count({
			where
		});

		if (total > 0) {
			this.addError(
				'type',
				'isUnique',
				this.__('This type of address has already been taken. A person can have one shipping and one billing address and an unlimited amount of other addresses.')
			);
			return;
		}
	}

	async loadRecord(): Promise<IPersonAddressModel> {
		return await (this.getModel('personAddress') as IPersonAddressModelStatic).findException({
			where: {
				address_id: this.pk,
				person_id: this.personId
			}
		}) as IPersonAddressModel;
	}

	rawOptions() {
		return {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id),
			type: [
				['shipping', this.__('Shipping address')],
				['billing', this.__('Billing address')],
				['other', this.__('Other')]
			]
		};
	}
}