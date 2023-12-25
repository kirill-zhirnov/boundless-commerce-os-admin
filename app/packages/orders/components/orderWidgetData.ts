import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPersonModelStatic} from '../../customer/models/person';
import {IPersonProfileModelStatic} from '../../customer/models/personProfile';
import {ICouponCodeModelStatic} from '../models/couponCode';
import {IOrderDiscountModelStatic} from '../models/orderDiscount';
import {IOrdersModel, IOrdersModelStatic} from '../models/orders';
import {IOrderServiceDeliveryModelStatic} from '../models/orderServiceDelivery';
import {ITrackNumberModelStatic} from '../models/trackNumber';
import OrderItems from './orderItems';
import TotalCalculator from './totalCalculator';
import * as thumbnailUrl from '../../cms/modules/thumbnail/url';
import FrontEndUrls from '../../../modules/url/frontendUrls';
import {IOrder} from '../../../@types/orders';
import {IPerson, TAddressType} from '../../../@types/person';
import {IPaymentMethodModel} from '../../payment/models/paymentMethod';
import {IPaymentMethod} from '../../../@types/payment';
import {TTaxStatus} from '../../../@types/product';
import {ITaxClass} from '../../../@types/system';
import {ISystemTax} from '../../../@types/settings';
import moolah from 'moolah';

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

		const data = {
			order: this.order.toJSON() as IOrder,
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
		Object.assign(out, {summary: this.calcSummary(data)});

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

		return paymentMethod.toJSON() as IPaymentMethod;
	}

	protected async getOrderShipping() {
		const OrderServiceDelivery = this.db.model('orderServiceDelivery') as IOrderServiceDeliveryModelStatic;

		const shipping = await OrderServiceDelivery.fetchShippingByOrderId(
			this.orderId,
			this.langId
		);

		return shipping || null;
	}

	protected async getOrderItems() {
		const orderItems = new OrderItems(this.instanceRegistry, this.clientRegistry, this.orderId);
		let items = await orderItems.getItems();

		//add total price for email tpls:
		items = items.map(({...attrs}) => {
			let total_price = null, total_price_formatted = null, final_price_formatted = null;

			if (attrs.final_price !== null) {
				total_price = moolah(attrs.final_price).times(attrs.qty).string();
				total_price_formatted = this.clientRegistry.getLocale().formatMoney(total_price);
				final_price_formatted = this.clientRegistry.getLocale().formatMoney(attrs.final_price);
			}

			return {
				...attrs,
				total_price,
				total_price_formatted,
				final_price_formatted,
			};
		});

		return items;
	}

	protected async getOrderDiscounts() {
		const OrderDiscountModel = this.db.model('orderDiscount') as IOrderDiscountModelStatic;
		const discounts = await OrderDiscountModel.findAll({
			include: [
				{model: this.db.model('couponCode') as unknown as ICouponCodeModelStatic}
			],
			where: {
				order_id: this.orderId
			},
			order: [
				['created_at', 'asc']
			]
		});

		return discounts || null;
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

		return {
			total_qty: total.itemsSubTotal.qty,
			subtotal_price: total.itemsSubTotal.price,
			discount_for_order: total.discount,
			total_price: total.price,
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
}