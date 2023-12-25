import Form, {TFormRules} from '../../../../modules/form';
import _ from 'underscore';
import {
	ICheckoutSettings,
	TAccountPolicy,
	TCheckoutContactRequirement
} from '../../../../@types/settings';

export default class OrderCheckoutForm extends Form<IAttrs> {
	getRules(): TFormRules {
		return ([
			['addressLine2, companyName', 'required'],
			['accountPolicy', 'inOptions', {options: 'accountPolicy', allowEmpty: false}],
			['contactFields', 'validateContactFields'],
			['footerLinks, customerNameRequired', 'safe'],
			['minOrderAmount', 'isDotNumeric'],
			['minOrderAmount', 'trim']
		] as TFormRules).concat(super.getRules());
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const prevAllSettings = await this.getInstanceRegistry().getSettings().get('orders', 'checkoutPage') as ICheckoutSettings || {};
		const checkoutSettings = this.parseAttrsToSettings(attrs);
		const newSettings = Object.assign(prevAllSettings, checkoutSettings);

		await this.getInstanceRegistry().getSettings().set('orders', 'checkoutPage', newSettings);

		const minOrderAmount = String(this.getSafeAttr('minOrderAmount')).replace(',', '.');
		await this.setSetting('orders', 'minOrderAmount', minOrderAmount);
	}

	async setup() {
		await super.setup();

		const settings: ICheckoutSettings = await this.getInstanceRegistry().getSettings().get('orders', 'checkoutPage') || {};
		const attrs = this.makeAttrsFromSettings(settings);

		const minOrderAmount = await this.getSetting('orders', 'minOrderAmount');
		Object.assign(attrs, {
			minOrderAmount
		});

		this.setAttributes(attrs);
	}

	async getTplData() {
		const data = await super.getTplData();
		const {logo} = await this.getInstanceRegistry().getSettings().get('orders', 'checkoutPage') as ICheckoutSettings || {};

		Object.assign(data, {logo: logo || null});

		return data;
	}

	validateContactFields(value) {
		if (!value) {
			this.addContactsError();
			return true;
		}

		const {phone_show, phone_required, email_show, email_required} = value;
		const {accountPolicy} = this.attributes;

		if (accountPolicy === 'login-required' && (email_show != '1' || email_required != '1')) {
			this.addError('contactFields[email_required]', 'isRequired', 'Email is required and should be visible for log in checkout');
			return true;
		}

		if (email_required == '1' && email_show != '1') {
			this.addError('contactFields[email_show]', 'isRequired', 'Required field should be visible');
			return true;
		}

		const out = (email_show == '1' && email_required == '1' || phone_show == '1' && phone_required == '1');

		if (!out) {
			this.addContactsError();
			return true;
		}

		return true;
	}

	addContactsError() {
		const errorMessage = 'At least one field should be visible and required';

		this.addError('contactFields[phone_required]', 'isRequired', errorMessage);
		this.addError('contactFields[email_required]', 'isRequired', errorMessage);
	}

	makeAttrsFromSettings(settings: ICheckoutSettings) {
		const filteredSettings = _.pick(settings, ['accountPolicy', 'customerNameRequired', 'addressLine2', 'companyName', 'footerLinks']);

		const contactFields = {
			email_show: settings.contactFields.email.show,
			email_required: settings.contactFields.email.required,
			phone_show: settings.contactFields.phone.show,
			phone_required: settings.contactFields.phone.required
		};

		return Object.assign(filteredSettings, {contactFields}, {
		});
	}

	parseAttrsToSettings(attrs: Partial<IAttrs>) {
		const filteredAttrs = _.pick(attrs, ['accountPolicy', 'addressLine2', 'companyName', 'footerLinks']);
		const contactFields = {
			email: {
				show: attrs.contactFields?.email_show == '1',
				required: attrs.contactFields?.email_required == '1'
			},
			phone: {
				show: attrs.contactFields?.phone_show == '1',
				required: attrs.contactFields?.phone_required == '1'
			}
		};
		const customerNameRequired = attrs.customerNameRequired == '' ? [] : attrs.customerNameRequired.split(',') as ('last' | 'first')[];

		const out: ICheckoutSettings = Object.assign(
			filteredAttrs,
			{contactFields, customerNameRequired}, {}
		);

		return out;
	}

	rawOptions() {
		return {
			accountPolicy: [
				[TAccountPolicy.guest, this.__('Checkout as guests')],
				[TAccountPolicy['guest-and-login'], this.__('Checkout as guests and optional log in')],
				[TAccountPolicy['login-required'], this.__('Log in is required')]
			]
		};
	}
}

interface IAttrs {
	contactFields: {
		phone_show: '1' | null;
		phone_required: '1' | null;
		email_show: '1' | null;
		email_required: '1' | null;
	},
	accountPolicy: TAccountPolicy,
	customerNameRequired: string;
	addressLine2: TCheckoutContactRequirement,
	companyName: TCheckoutContactRequirement,
	footerLinks: {title: string; url: string}[],
	minOrderAmount: string;
}