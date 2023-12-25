import Form, {IFormOptions, ITplData} from '../../../../modules/form';
import {
	IFetchedShipping,
	IOrderServiceDeliveryModelStatic
} from '../../models/orderServiceDelivery';
import {IOrderServiceModel, IOrderServiceModelStatic} from '../../models/orderService';
import {IOrdersModelStatic} from '../../models/orders';
import {IItemPriceModel, IItemPriceModelStatic} from '../../models/itemPrice';
import {diff} from 'deep-object-diff';
import * as orderEvents from '../../components/orderEventNotification';

interface IAttrs {
	shipping: number|string|null,
	custom_title: null|string,
	rate: number|string|null,
	text_info: string|null
}

export default class OrderShippingForm extends Form<IAttrs> {
	protected orderId: number;
	protected fetchedShipping?: IFetchedShipping;

	constructor(options: IFormOptions & {orderId: number}) {
		super(options);

		this.orderId = options.orderId;
	}

	getRules() {
		return [
			['shipping, rate', 'required'],
			['shipping', 'inOptions', {options: 'shipping'}],
			['custom_title', 'trim'],
			['custom_title', 'validateCustomTitle'],
			['rate', 'isDotNumeric', {min: 0}],
			['rate', 'toNumber'],
			['text_info', 'safe'],
		];
	}

	async loadRecord() {
		this.fetchedShipping = await this.loadShipping();

		return this.fetchedShipping;
	}


	async setupAttrs() {
		this.fetchedShipping = await this.loadShipping();

		if (this.fetchedShipping) {
			const attrs: IAttrs = {
				shipping: this.fetchedShipping.delivery_id || 'custom',
				custom_title: this.fetchedShipping.delivery_id ? null : this.fetchedShipping.title,
				rate: this.fetchedShipping.price,
				text_info: this.fetchedShipping.text_info
			};
			this.setAttributes(attrs);
			this.scenario = 'update';
		} else {
			this.setAttributes({
				shipping: null,
				custom_title: null,
				rate: null,
				text_info: null
			});
			this.scenario = 'insert';
		}
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const {orderService, itemPrice} = await this.getOrderServiceDelivery();
		const orderServiceDelivery = orderService.orderServiceDelivery!;

		const deliveryAttrs = {
			delivery_id: null,
			title: null,
			text_info: attrs.text_info
		};

		if (attrs.shipping == 'custom') {
			deliveryAttrs.title = attrs.custom_title;
		} else {
			deliveryAttrs.delivery_id = attrs.shipping;
		}

		await orderServiceDelivery.set(deliveryAttrs).save();

		let price = null;
		if (!isNaN(attrs.rate as unknown as number)) {
			price = attrs.rate;
		}

		await itemPrice.set({
			basic_price: price,
			final_price: price
		}).save();

		//update item price if doesn't exists and trigger trigger to recalculate total_price.
		await (this.getModel('orderService') as unknown as IOrderServiceModelStatic).update({
			item_price_id: itemPrice.item_price_id
		}, {
			where: {
				order_service_id: orderService.order_service_id
			}
		});

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.orderId,
			{shipping: diff(this.fetchedShipping, await this.loadShipping())}
		);

		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.orderId);
	}

	loadShipping() {
		return (this.getModel('orderServiceDelivery') as IOrderServiceDeliveryModelStatic)
		.fetchShippingByOrderId(Number(this.orderId), this.getEditingLang().lang_id);
	}

	async getOrderServiceDelivery(): Promise<{orderService: IOrderServiceModel, itemPrice: IItemPriceModel}> {
		const OrderServiceModel = this.getModel('orderService') as IOrderServiceModelStatic;
		const OrderServiceDeliveryModel = this.getModel('orderServiceDelivery') as IOrderServiceDeliveryModelStatic;
		const ItemPriceModel = this.getModel('itemPrice') as IItemPriceModelStatic;

		let orderServiceId = this.fetchedShipping?.order_service_id;

		if (!orderServiceId) {
			const orderService = await OrderServiceModel.build({
				order_id: this.orderId,
				qty: 1,
				is_delivery: true
			}).save();

			orderServiceId = orderService.order_service_id;
		}

		const orderService = await OrderServiceModel.findOne({
			include: [
				{model: OrderServiceDeliveryModel},
				{model: ItemPriceModel},
			],
			where: {
				order_service_id: orderServiceId
			}
		});

		let itemPrice = orderService.itemPrice;
		if (!itemPrice) {
			itemPrice = await ItemPriceModel.build({}).save();
		}

		return {orderService, itemPrice};
	}

	rawOptions() {
		return {
			shipping: this.loadShippingOptions()
		};
	}

	async loadShippingOptions() {
		//@ts-ignore
		const options = await this.getModel('delivery').findOptions(
			this.getEditingLang().lang_id,
			this.getEditingSite().site_id
		);

		options.push(['custom', this.__('Custom shipping')]);

		return options;
	}

	async getTplData() {
		const data: ITplData<IAttrs> & {orderId?: number} = await super.getTplData();
		data.orderId = this.orderId;

		return data;
	}

	validateCustomTitle(value: string) {
		if (!value && this.attributes.shipping == 'custom') {
			this.addError('custom_title', 'required', this.__('Value cannot be blank.'));
			return;
		}
	}
}