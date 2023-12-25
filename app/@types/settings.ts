export interface ICheckoutSettings {
	logo?: string|null;
	contactFields?: {
		phone: IContactSetting;
		email: IContactSetting;
	},
	accountPolicy?: TAccountPolicy,
	customerNameRequired?: ('last'|'first')[];
	addressLine2?: TCheckoutContactRequirement,
	companyName?: TCheckoutContactRequirement,
	footerLinks?: {title: string; url: string}[]
}

interface IContactSetting {
	show: boolean;
	required: boolean;
}

export enum TAccountPolicy {
	'login-required' = 'login-required',
	'guest' = 'guest',
	'guest-and-login' = 'guest-and-login'
}

export enum TCheckoutContactRequirement {
	hidden = 'hidden',
	optional = 'optional',
	required = 'required'
}

export enum TCalculateTaxBasedOn {
	storeLocation = 'storeLocation',
	customerShippingAddress = 'customerShippingAddress',
	customerBillingAddress = 'customerBillingAddress',
}

export interface ISystemTax {
	turnedOn: boolean,
	pricesEnteredWithTax: boolean,
	calculateTaxBasedOn: TCalculateTaxBasedOn,
	taxTitle: string
}
