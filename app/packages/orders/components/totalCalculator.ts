import moolah from 'moolah';
import {calcMarkUp} from '../../payment/modules/markUpCalculator.client';
import {TDiscountType} from '../../../@types/orders';
import {TTaxStatus} from '../../../@types/product';
import {ISystemTax, TCalculateTaxBasedOn} from '../../../@types/settings';
import {ITaxClass, ITaxRate} from '../../../@types/system';

const TAX_BASE_COEFF = '10000';

export default class TotalCalculator {
	protected itemsList: IItem[] = [];

	protected shipping: {price: string, qty: number} = {
		price: '0',
		qty: 0
	};

	protected services: IItemsTotal = {
		price: '0',
		qty: 0
	};

	protected paymentMarkUp: number = 0;

	protected discounts: IDiscountRow[] = [];

	protected taxSettings: ISystemTax = {
		turnedOn: false,
		pricesEnteredWithTax: false,
		calculateTaxBasedOn: TCalculateTaxBasedOn.storeLocation,
		taxTitle: ''
	};

	protected taxClasses: ITaxClass[] = [];

	protected shippingLocation: ICustomerLocation|null = null;

	protected billingLocation: ICustomerLocation|null = null;

	addItem(
		id: number,
		price: string|number|null,
		qty: number,
		taxStatus: TTaxStatus = TTaxStatus.none,
		taxClassId: number|null = null
	): TotalCalculator {
		if (!this.itemsList.some(el => el.id === id)) {
			this.itemsList.push({
				id,
				price: price === null ? '0' : String(price),
				qty,
				taxStatus,
				taxClassId
			});
		}

		return this;
	}

	changeItem(item: IItem): TotalCalculator {
		const index = this.itemsList.findIndex(el => el.id === item.id);
		if (index !== -1) {
			Object.assign(this.itemsList[index], item);
		}
		return this;
	}

	changeItemPrice(itemId: number, price: number|string|null): TotalCalculator {
		const index = this.itemsList.findIndex(el => el.id === itemId);
		if (index !== -1) {
			this.itemsList[index].price = price === null ? '0' : String(price);
		}
		return this;
	}
	changeItemQty(itemId: number, qty: number): TotalCalculator {
		const index = this.itemsList.findIndex(el => el.id === itemId);
		if (index !== -1) {
			this.itemsList[index].qty = qty;
		}
		return this;
	}

	rmItem(id: number): TotalCalculator {
		this.itemsList = this.itemsList.filter(el => el.id !== id);
		return this;
	}

	clearItems(): TotalCalculator {
		this.itemsList = [];
		return this;
	}

	setShipping(price: number|string|null, qty: number|null) {
		this.shipping.price = (price === null) ? '0' : String(price);

		if (qty === null) {
			qty = 0;
		}
		this.shipping.qty = qty;

		return this;
	}

	setServices(price: number|string|null, qty: number|null) {
		if (price === null) {
			price = '0';
		}

		if (qty === null) {
			qty = 0;
		}

		this.services = {
			price: String(price),
			qty
		};

		return this;
	}

	clearDiscounts(): TotalCalculator {
		this.discounts = [];
		return this;
	}

	setDiscounts(discounts: IDiscountRow[]): TotalCalculator {
		discounts.forEach(row => this.addDiscount(row.type, row.value));

		return this;
	}

	setPaymentMarkUp(val: number): TotalCalculator {
		this.paymentMarkUp = val;

		return this;
	}

	addDiscount(type: TDiscountType, value: number): TotalCalculator {
		this.discounts.push({
			type,
			value
		});

		return this;
	}

	protected calcTotalForItems(): IItemsTotal {
		const price = this.itemsList.reduce(
			(total, {price, qty}) => moolah(price).times(qty).plus(total).string(),
			'0'
		);
		const qty = this.itemsList.reduce((totalQty, {qty}) => totalQty + Number(qty), 0);

		return {
			price, qty
		};
	}

	calcTotal(): ITotal {
		const itemsTotal = this.calcTotalForItems();

		const basicPrice = moolah(itemsTotal.price)
			.plus(this.shipping.price)
			.plus(this.services.price)
			.string()
		;

		let price = basicPrice, discount = '0';
		this.discounts.forEach((row) => {
			switch (row.type) {
				case 'fixed':
					discount = moolah(discount).plus(row.value).string();
					price = moolah(price).less(row.value).string();
					break;

				case 'percent': {
					//apply discount only to items, not services:
					const rowVal = moolah(moolah(row.value).by(100)).times(itemsTotal.price).string();
					discount = moolah(discount).plus(rowVal).string();
					price = moolah(price).less(rowVal).string();
					break;
				}
			}
		});

		let paymentMarkUp = '0';
		if (this.paymentMarkUp) {
			paymentMarkUp = calcMarkUp(price, this.paymentMarkUp);
			price = moolah(price).plus(paymentMarkUp).string();
		}

		const adjustment = moolah(discount).plus(paymentMarkUp).string();
		const adjustmentCoefficient = (itemsTotal.price !== null && parseInt(itemsTotal.price) !== 0)
			? moolah(adjustment).by(itemsTotal.price).times(TAX_BASE_COEFF).string()
			: '0'
		;
		const priceBaseCoefficient = moolah(TAX_BASE_COEFF).less(adjustmentCoefficient).string();

		const itemsWithTaxBases: IItemWithTaxes[] = this.itemsList.map((item) => ({
			...item,
			taxBase: moolah(item.price).times(priceBaseCoefficient).string(),
		}));

		const tax = this.calcTaxes(itemsWithTaxBases);

		if (tax.mode === 'addToTotal') {
			price = moolah(price).plus(tax.totalTaxAmount).string();
		}

		return {
			itemsSubTotal: itemsTotal,
			price,
			discount: `${discount}`,
			paymentMarkUp: `${paymentMarkUp}`,
			tax,
			taxSettings: this.taxSettings,
			//it needs to unify calculations
			servicesSubTotal: {
				price: moolah(this.services.price).plus(this.shipping.price).string(),
				qty: this.services.qty + this.shipping.qty
			}
		};
	}

	protected calcTaxes(itemsWithTax: IItemWithTaxes[]): ITaxCalculated {
		if (!this.taxSettings.turnedOn) {
			return {totalTaxAmount: null, itemsWithTax};
		}

		if (this.taxSettings.pricesEnteredWithTax) {
			return this.calcInclusiveTaxes(itemsWithTax);
		} else {
			return this.calcExclusiveTaxes(itemsWithTax);
		}
	}

	protected calcInclusiveTaxes(itemsWithTax: IItemWithTaxes[]): ITaxCalculated {
		let totalTaxAmount = '0';
		const shippingTaxRates: ITaxRate[] = [];

		for (const item of itemsWithTax) {
			if (item.taxStatus !== TTaxStatus.taxable) {
				continue;
			}

			let itemTaxes = '0';
			const taxRates = this.filterTaxRatesBySource(this.findTaxRates(item.taxClassId), TCalculateTaxBasedOn.storeLocation);
			const appliedTaxes: IAppliedTax[] = [];
			for (const taxRate of taxRates) {
				const base = item.taxBase;
				const taxValue = moolah(base).times(taxRate.rate).by(100).string();

				appliedTaxes.push({
					tax_rate_id: taxRate.tax_rate_id,
					base,
					rate: taxRate.rate,
					taxValue
				});
				itemTaxes = moolah(itemTaxes).plus(taxValue).string();

				if (taxRate.include_shipping) {
					if (shippingTaxRates.findIndex(({tax_rate_id}) => tax_rate_id == taxRate.tax_rate_id) === -1) {
						shippingTaxRates.push(taxRate);
					}
				}
			}

			itemTaxes = moolah(itemTaxes).by(TAX_BASE_COEFF).string();

			item.itemTaxes = itemTaxes;
			item.appliedTaxes = appliedTaxes;

			const totalTaxesByItem = moolah(itemTaxes).times(item.qty).string();
			totalTaxAmount = moolah(totalTaxAmount).plus(totalTaxesByItem).string();
		}

		let shippingTaxes = '0';
		const shippingAppliedTaxes: IAppliedTax[] = [];
		for (const taxRate of shippingTaxRates) {
			const base = this.shipping.price;
			const taxValue = moolah(base).times(taxRate.rate).by(100).string();

			shippingAppliedTaxes.push({
				tax_rate_id: taxRate.tax_rate_id,
				base,
				rate: taxRate.rate,
				taxValue
			});

			shippingTaxes = moolah(shippingTaxes).plus(taxValue).string();
		}

		totalTaxAmount = moolah(totalTaxAmount).plus(shippingTaxes).string();

		return {
			totalTaxAmount,
			itemsWithTax,
			mode: 'alreadyInTotal',
			shipping: {
				shippingTaxes: shippingTaxes,
				appliedTaxes: shippingAppliedTaxes
			}
		};
	}
	/**
	 * Calculate taxes if prices are entered without taxes (exclusevly)
	 * @protected
	 */
	protected calcExclusiveTaxes(itemsWithTax: IItemWithTaxes[]): ITaxCalculated {
		let totalTaxAmount = '0';
		const shippingTaxRates: ITaxRate[] = [];

		for (const item of itemsWithTax) {
			if (item.taxStatus !== TTaxStatus.taxable) {
				continue;
			}

			const taxRates = this.filterTaxRatesBySource(this.findTaxRates(item.taxClassId), this.taxSettings.calculateTaxBasedOn);

			let itemTaxes = '0', itemPriceWithTaxes = item.taxBase;
			const appliedTaxes: IAppliedTax[] = [];
			for (const taxRate of taxRates) {
				const base = (taxRate.is_compound) ? itemPriceWithTaxes : item.taxBase;
				const taxValue = moolah(base).times(taxRate.rate).by(100).string();

				appliedTaxes.push({
					tax_rate_id: taxRate.tax_rate_id,
					base,
					rate: taxRate.rate,
					taxValue
				});

				itemTaxes = moolah(itemTaxes).plus(taxValue).string();
				itemPriceWithTaxes = moolah(itemPriceWithTaxes).plus(taxValue).string();

				if (taxRate.include_shipping) {
					if (shippingTaxRates.findIndex(({tax_rate_id}) => tax_rate_id == taxRate.tax_rate_id) === -1) {
						shippingTaxRates.push(taxRate);
					}
				}
			}

			itemTaxes = moolah(itemTaxes).by(TAX_BASE_COEFF).string();

			item.itemTaxes = itemTaxes;
			item.appliedTaxes = appliedTaxes;

			const totalTaxesByItem = moolah(itemTaxes).times(item.qty).string();
			totalTaxAmount = moolah(totalTaxAmount).plus(totalTaxesByItem).string();
		}

		let shippingTaxes = '0', shippingPriceWithTaxes = this.shipping.price;
		const shippingAppliedTaxes: IAppliedTax[] = [];
		for (const taxRate of shippingTaxRates) {
			const base = (taxRate.is_compound) ? shippingPriceWithTaxes : this.shipping.price;
			const taxValue = moolah(base).times(taxRate.rate).by(100).string();

			shippingAppliedTaxes.push({
				tax_rate_id: taxRate.tax_rate_id,
				base,
				rate: taxRate.rate,
				taxValue
			});

			shippingTaxes = moolah(shippingTaxes).plus(taxValue).string();
			shippingPriceWithTaxes = moolah(shippingPriceWithTaxes).plus(taxValue).string();
		}

		totalTaxAmount = moolah(totalTaxAmount).plus(shippingTaxes).string();

		return {
			totalTaxAmount,
			itemsWithTax,
			mode: 'addToTotal',
			shipping: {
				shippingTaxes: shippingTaxes,
				appliedTaxes: shippingAppliedTaxes
			}
		};
	}

	setTaxSettings(value: ISystemTax): TotalCalculator {
		this.taxSettings = value;
		return this;
	}

	setShippingLocation(value: ICustomerLocation|null): TotalCalculator {
		this.shippingLocation = value;
		return this;
	}

	setBillingLocation(value: ICustomerLocation|null): TotalCalculator {
		this.billingLocation = value;
		return this;
	}

	resetLocations(): TotalCalculator {
		this.shippingLocation = null;
		this.billingLocation = null;
		return this;
	}

	setTaxClasses(taxClasses: ITaxClass[]): TotalCalculator {
		this.taxClasses = taxClasses;
		return this;
	}

	/**
	 * If null - default TaxClass will be used.
	 * @param classId
	 */
	findTaxRates(classId: number|null = null): ITaxRate[] {
		const taxClass = this.taxClasses.find(({tax_class_id, is_default}) => {
			if (classId) {
				return (classId == tax_class_id);
			} else {
				return is_default;
			}
		});

		return (taxClass && taxClass.taxRates) ? taxClass.taxRates : [];
	}

	filterTaxRatesBySource(taxRates: ITaxRate[], calculateTaxBasedOn: TCalculateTaxBasedOn): ITaxRate[] {
		if (calculateTaxBasedOn === TCalculateTaxBasedOn.storeLocation) {
			return taxRates.filter(({country_id}) => country_id === null);
		} else if (calculateTaxBasedOn === TCalculateTaxBasedOn.customerShippingAddress) {
			return taxRates.filter(({country_id}) => {
				return this.shippingLocation?.country_id && (this.shippingLocation.country_id == country_id || country_id === null);
			});
		} else if (calculateTaxBasedOn === TCalculateTaxBasedOn.customerBillingAddress) {
			return taxRates.filter(({country_id}) => {
				return this.billingLocation?.country_id && (this.billingLocation.country_id == country_id || country_id === null);
			});
		}

		return [];
	}
}

export interface IItem {
	id: number,
	price: string,
	qty: number,
	taxStatus: TTaxStatus,
	taxClassId: number|null
}

export interface IItemWithTaxes extends IItem {
	//tax base - включает в себя равномерно распределенную скидку/наценку между всеми товарами,
	//налоги нам нужно взымать с фактически уплаченной суммы (включая все скидки и наценки)
	taxBase: string;
	itemTaxes?: string;
	appliedTaxes?: IAppliedTax[];
}

export interface IItemsTotal {
	price: string,
	qty: number
}

export interface IDiscountRow {
	type: TDiscountType,
	value: number
}

export interface ICustomerLocation {
	country_id: number;
	state?: string;
	zip?: string;
}

export interface IAppliedTax {
	tax_rate_id: number;
	base: string;
	rate: string;
	taxValue: string;
}

export interface ITaxCalculated {
	totalTaxAmount: string|null,
	itemsWithTax: IItemWithTaxes[],
	mode?: 'addToTotal'|'alreadyInTotal',
	shipping?: {
		shippingTaxes: string,
		appliedTaxes: IAppliedTax[];
	}
}

export interface ITotal {
	itemsSubTotal: IItemsTotal,
	price: string;
	discount: string;
	paymentMarkUp: string;
	tax: ITaxCalculated,
	taxSettings: ISystemTax,
	servicesSubTotal: {
		price: string,
		qty: number
	}
}