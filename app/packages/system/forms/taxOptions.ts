import Form from '../../../modules/form/index';
import {TCalculateTaxBasedOn} from '../../../@types/settings';

interface IAttrs {
	turnedOn: string,
	pricesEnteredWithTax: string,
	calculateTaxBasedOn: TCalculateTaxBasedOn,
	taxTitle: string
}

export default class TaxOptionsForm extends Form<IAttrs> {
	getRules() {
		return [
			['turnedOn', 'safe'],
			['pricesEnteredWithTax, calculateTaxBasedOn, taxTitle', 'required'],
			['calculateTaxBasedOn', 'inOptions', {options: 'taxBasedOn'}],
			['pricesEnteredWithTax', 'inOptions', {options: 'pricesEnteredWithTax'}],
		];
	}

	async setupAttrs() {
		const taxSettings = await this.getSetting('system', 'tax');

		this.setAttributes({
			turnedOn: taxSettings.turnedOn ? '1' : '0',
			pricesEnteredWithTax: taxSettings.pricesEnteredWithTax ? '1' : '0',
			calculateTaxBasedOn: taxSettings.calculateTaxBasedOn,
			taxTitle: taxSettings.taxTitle
		});
	}

	async save() {
		let calculateTaxBasedOn = this.getSafeAttr('calculateTaxBasedOn');
		const turnedOn = this.getSafeAttr('turnedOn') == '1';
		const pricesEnteredWithTax = this.getSafeAttr('pricesEnteredWithTax') == '1';
		const taxTitle = this.getSafeAttr('taxTitle');

		if (pricesEnteredWithTax && calculateTaxBasedOn != TCalculateTaxBasedOn.storeLocation) {
			calculateTaxBasedOn = TCalculateTaxBasedOn.storeLocation;
		}

		const taxSettings = {
			...await this.getSetting('system', 'tax'),
			turnedOn,
			pricesEnteredWithTax,
			calculateTaxBasedOn,
			taxTitle
		};

		await this.setSetting('system', 'tax', taxSettings);
	}

	rawOptions() {
		return {
			taxBasedOn: [
				[TCalculateTaxBasedOn.storeLocation, this.__('Same rates for all customers')],
				[TCalculateTaxBasedOn.customerShippingAddress, this.__('Customer shipping address')],
				[TCalculateTaxBasedOn.customerBillingAddress, this.__('Customer billing address')],
			],
			pricesEnteredWithTax: [
				['1', this.__('Yes, Prices are entered inclusive of tax')],
				['0', this.__('No, Prices are entered exclusive of tax')],
			]
		};
	}
}