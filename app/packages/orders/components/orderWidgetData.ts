import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPersonModelStatic} from '../../customer/models/person';
import {IPersonProfileModelStatic} from '../../customer/models/personProfile';
import {ICouponCodeModelStatic} from '../models/couponCode';
import {IOrderDiscountModel, IOrderDiscountModelStatic} from '../models/orderDiscount';
import {IOrdersModel, IOrdersModelStatic} from '../models/orders';
import {IOrderServiceDeliveryModelStatic} from '../models/orderServiceDelivery';
import {ITrackNumberModelStatic} from '../models/trackNumber';
import OrderItems from './orderItems';
import TotalCalculator from './totalCalculator';
import * as thumbnailUrl from '../../cms/modules/thumbnail/url';
import FrontEndUrls from '../../../modules/url/frontendUrls';
import {IOrder, TDiscountType, TOrderDiscountSource} from '../../../@types/orders';
import {IPerson, IPersonAddress, TAddressType} from '../../../@types/person';
import {IPaymentMethodModel} from '../../payment/models/paymentMethod';
import {IPaymentMethod} from '../../../@types/payment';
import {TTaxStatus} from '../../../@types/product';
import {ITaxClass} from '../../../@types/system';
import {ISystemTax} from '../../../@types/settings';
import moolah from 'moolah';
import {TDateFormatType} from '../../../modules/locale';

export default class OrderWidgetData {
	protected db: ExtendedSequelize;
	protected order?: IOrdersModel;
	protected langId: number | null = null;

	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected clientRegistry: IServerClientRegistry,
		protected orderId: number,
	) {
		this.db = this.instanceRegistry.getDb();
		this.langId = this.clientRegistry.getLang().lang_id;
	}

	async getOrderData() {
		await this.fetchOrder();

		const locale = this.clientRegistry.getLocale();
		const order = this.order.toJSON() as IOrder;
		Object.assign(order, {
			payment_mark_up_formatted: Number(order.payment_mark_up) > 0 ? locale.formatMoney(order.payment_mark_up) : '0',
			tax_amount_formatted: order.tax_amount !== null ? locale.formatMoney(order.tax_amount) : null,
			created_at_formatted_long: locale.formatDate(order.created_at, TDateFormatType.long),
			created_at_formatted_short: locale.formatDate(order.created_at, TDateFormatType.short),
		});

		const data = {
			order,
			items: await this.getOrderItems(),
			customer: await this.getCustomerInfo(),
			shipping: await this.getOrderShipping(),
			discounts: await this.getOrderDiscounts(),
			trackNumbers: await this.getOrderTrackNums(),
			shippingAddress: null,
			billingAddress: null,
			addressesForTaxes: {
				shippingAddress: null,
				billingAddress: null,
			},
			paymentMethod: await this.getPaymentMethod(),
			taxSettings: (await this.instanceRegistry.getSettings().get('system', 'tax') as ISystemTax),
			taxClasses: await this.getTaxClasses()
		};

		if (data.customer?.personAddresses) {
			let shippingAddress, defaultAddress, billingAddress;
			for (const address of data.customer.personAddresses) {
				if (address.type === TAddressType.shipping) {
					shippingAddress = address;
				} else if (address.type === TAddressType.billing) {
					billingAddress = address;
				}

				if (address.is_default) {
					defaultAddress = address;
				}
			}

			if (shippingAddress) {
				data.shippingAddress = shippingAddress;
				data.addressesForTaxes.shippingAddress = shippingAddress;
			}

			if (billingAddress) {
				data.billingAddress = billingAddress;
				data.addressesForTaxes.billingAddress = billingAddress;
			}

			if (!shippingAddress && defaultAddress) {
				data.shippingAddress = defaultAddress;
			}
		}

		const out = await this.populateDataWithUrls(data);
		Object.assign(out, {
			summary: this.calcSummary(data),
			shippingAddressTpl: out.shippingAddress ? this.prepareAddressForTpl(out.shippingAddress) : null,
			billingAddressTpl: out.billingAddress ? this.prepareAddressForTpl(out.billingAddress) : null
		});

		return out;
	}

	protected async fetchOrder() {
		const order = await (this.db.model('orders') as IOrdersModelStatic).findOne({
			include: [
				{
					model: this.db.model('orderStatus'),
					required: false,
					include: [
						{
							model: this.db.model('orderStatusText'),
							where: {lang_id: this.langId},
							required: false
						}
					]
				},
				{
					model: this.db.model('orderProp'),
					required: false
				}
			],
			where: {
				order_id: this.orderId
			}
		}) as IOrdersModel;

		if (!order) {
			throw new Error(`Cant fetch order data by id "${this.orderId}"`);
		}

		this.order = order;
	}

	protected async getCustomerInfo(): Promise<IPerson | null> {
		if (!this.order?.customer_id) return null;

		const customer = await (this.db.model('person') as IPersonModelStatic).findOne({
			include: [
				{model: (this.db.model('personProfile')) as IPersonProfileModelStatic},
				{
					model: this.db.model('personAddress'),
					required: false,
					include: [
						{model: this.db.model('vwCountry'), required: false}
					]
				}
			],
			where: {
				person_id: this.order.customer_id
			}
		});

		return customer.toJSON() as IPerson;
	}

	protected async getPaymentMethod(): Promise<IPaymentMethod|null> {
		if (!this.order?.payment_method_id) return null;

		const paymentMethod = await this.db.model('paymentMethod').findOne({
			include: [
				{
					model: this.db.model('paymentMethodText'),
					where: {lang_id: this.langId},
					required: false
				},
				{
					model: this.db.model('paymentGateway'),
				}
			],
			where: {
				payment_method_id: this.order.payment_method_id
			}
		}) as IPaymentMethodModel;

		let out = null;
		if (paymentMethod) {
			out = paymentMethod.toJSON();

			Object.assign(out, {
				title: paymentMethod.paymentMethodTexts[0]?.title,
				hasMarkUp: (paymentMethod.mark_up && Number(paymentMethod.mark_up) > 0) ? true : false
			});
		}

		return out;
	}

	protected async getOrderShipping() {
		const OrderServiceDelivery = this.db.model('orderServiceDelivery') as IOrderServiceDeliveryModelStatic;

		const shipping = await OrderServiceDelivery.fetchShippingByOrderId(
			this.orderId,
			this.langId
		);

		if (shipping) {
			Object.assign(shipping, {
				price_formatted: shipping.price ? this.clientRegistry.getLocale().formatMoney(shipping.price) : null
			});
		}

		return shipping;
	}

	protected async getOrderItems() {
		const orderItems = new OrderItems(this.instanceRegistry, this.clientRegistry, this.orderId);
		let items = await orderItems.getItems();

		//add total price for email tpls:
		items = items.map(({...attrs}) => {
			let total_price_formatted = null, final_price_formatted = null;

			if (attrs.total_price && attrs.total_price !== null) {
				total_price_formatted = this.clientRegistry.getLocale().formatMoney(attrs.total_price);
			}

			if (attrs.final_price && attrs.final_price !== null) {
				final_price_formatted = this.clientRegistry.getLocale().formatMoney(attrs.final_price);
			}

			return {
				...attrs,
				total_price_formatted,
				final_price_formatted,
			};
		});

		return items;
	}

	protected async getOrderDiscounts() {
		const OrderDiscountModel = this.db.model('orderDiscount') as IOrderDiscountModelStatic;
		const discounts = (await OrderDiscountModel.findAll({
			include: [
				{model: this.db.model('couponCode') as unknown as ICouponCodeModelStatic}
			],
			where: {
				order_id: this.orderId
			},
			order: [
				['created_at', 'asc']
			]
		})) as IOrderDiscountModel[];

		return discounts.map((row) => {
			const out = row.toJSON();

			let value_formatted = String(row.value);
			if (row.discount_type == TDiscountType.percent) {
				value_formatted = `${this.clientRegistry.getLocale().formatNumber(row.value)}%`;
			} else if (row.discount_type == TDiscountType.fixed) {
				value_formatted = this.clientRegistry.getLocale().formatMoney(row.value);
			}

			Object.assign(out, {
				isManualSource: row.source == TOrderDiscountSource.manual,
				isFixedType: row.discount_type == TDiscountType.fixed,
				isPercentType: row.discount_type == TDiscountType.percent,
				value_formatted
			});

			return out;
		});
	}

	protected async getOrderTrackNums() {
		return await (this.db.model('trackNumber') as ITrackNumberModelStatic).findAll({
			where: {
				order_id: this.orderId
			},
			order: [
				['created_at', 'asc']
			]
		});
	}

	protected async populateDataWithUrls(data) {
		const items = data.items || [];
		for (const item of items) {
			if (item.image?.path) {
				item.image.src = thumbnailUrl.getAttrs(this.instanceRegistry, item.image, 'scaled', 'xs').src;
			}
			const frontendUrls = new FrontEndUrls(this.instanceRegistry);
			if (item.product) {
				item.product.url = await frontendUrls.getProductUrl(item.product) || '';
			}
		}
		return data;
	}

	protected calcSummary(data) {
		const calculator = new TotalCalculator();
		calculator.setTaxSettings(data.taxSettings);
		calculator.setTaxClasses(data.taxClasses);

		for (const item of data.items) {
			let taxStatus: TTaxStatus = TTaxStatus.none;
			let taxClassId: number|null = null;

			if (['variant', 'product'].includes(item.type)) {
				taxStatus = item.product.tax_status;
				taxClassId = item.product.tax_class_id;
			}

			calculator.addItem(item.item_id, item.final_price, item.qty, taxStatus, taxClassId);
		}

		if (data.shipping) {
			calculator.setShipping(data.shipping?.price, data.shipping ? 1 : null);
		}

		const discounts = data.discounts || [];
		calculator.setDiscounts(discounts.map(el => ({
			type: el.discount_type,
			value: Number(el.value)
		})));

		if (data.paymentMethod?.mark_up) {
			calculator.setPaymentMarkUp(data.paymentMethod.mark_up);
		}

		const {shippingAddress, billingAddress} = data.addressesForTaxes;
		if (shippingAddress && shippingAddress.country_id) {
			const {country_id, state, zip} = shippingAddress;
			calculator.setShippingLocation({country_id, state, zip});
		}

		if (billingAddress && billingAddress.country_id) {
			const {country_id, state, zip} = billingAddress;
			calculator.setBillingLocation({country_id, state, zip});
		}

		const total = calculator.calcTotal();

		const subtotal_price = total.itemsSubTotal.price;
		const discount_for_order = total.discount;
		const total_price = total.price;
		const locale = this.clientRegistry.getLocale();

		return {
			total_qty: total.itemsSubTotal.qty,
			subtotal_price,
			subtotal_price_formatted: locale.formatMoney(subtotal_price),
			discount_for_order,
			discount_for_order_formatted: locale.formatMoney(discount_for_order),
			total_price,
			total_price_formatted: locale.formatMoney(total_price),
		};
	}

	protected async getTaxClasses(): Promise<ITaxClass[]> {
		const rows = await this.db.model('taxClass').findAll({
			include: [{model: this.db.model('taxRate')}],
			order: [[this.db.model('taxRate'), 'priority', 'asc']],
		});
		const taxClasses = rows.map(row => row.toJSON()) as ITaxClass[];
		return taxClasses;
	}

	prepareAddressForTpl(address: IPersonAddress) {
		const out = {};
		const name = [];
		if (address.first_name) {
			name.push(address.first_name);
		}
		if (address.last_name) {
			name.push(address.last_name);
		}

		if (name.length) {
			Object.assign(out, {name: name.join(' ')});
		}

		if (address.company) {
			Object.assign(out, {company: address.company});
		}

		if (address.address_line_1) {
			Object.assign(out, {address_line_1: address.address_line_1});
		}

		if (address.address_line_2) {
			Object.assign(out, {address_line_2: address.address_line_2});
		}

		const cityWithCountry = [];
		if (address.city) {
			cityWithCountry.push(address.city);
		}

		if (address.state) {
			cityWithCountry.push(address.state);
		}

		if (address.vwCountry?.title) {
			cityWithCountry.push(address.vwCountry?.title);
		}

		if (cityWithCountry.length) {
			Object.assign(out, {city_with_country: cityWithCountry.join(', ')});
		}

		if (address.zip) {
			Object.assign(out, {zip: address.zip});
		}

		return out;
	}
}