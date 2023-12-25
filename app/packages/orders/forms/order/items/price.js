import Form from '../../../../../modules/form';
import {IOrdersModel} from '../../../models/orders'; //eslint-disable-line
import {TOrdersItem} from '../../../../../@types/orders'; //eslint-disable-line
import OrderItems from '../../../components/orderItems';
import errors from '../../../../../modules/errors/errors';
import {calcFinalPrice} from '../../../components/priceCalculator';
import * as orderEvents from '../../../components/orderEventNotification';

export default class OrderItemPrice extends Form {
	constructor(options) {
		super(options);

		/**
		 * @type {null|IOrdersModel}
		 */
		this.order = null;
		this.orderId = options.orderId || null;

		/**
		 * @type {null|TOrdersItem}
		 */
		this.record = null;

		/**
		 * @type {{type?: string, basic_price?: string|number, discount_value?: null|string|number}}
		 */
		this.attributes = {};
	}

	getRules() {
		return [
			['basic_price, type', 'required'],
			['basic_price, discount_value', 'isDotNumeric', {min: 0}],
			['basic_price, discount_value', 'toNumber'],
			['type', 'inOptions', {options: 'type'}],
			['discount_value', 'validateDiscountVal']
		];
	}

	async setup() {
		await super.setup();

		const item = await this.loadOrderItemByPk();
		if (item) {
			this.record = item;
			this.attributes = {
				basic_price: item.basic_price,
				type: 'no',
				discount_value: null
			};

			if (item.discount_amount) {
				this.attributes.type = 'amount';
				this.attributes.discount_value = item.discount_amount;
			} else if (item.discount_percent) {
				this.attributes.type = 'percentage';
				this.attributes.discount_value = item.discount_percent;
			}
		} else {
			throw new errors.HttpError(404, `Item not found: ${this.pk}`);
		}
	}

	async save() {
		/**
		 * @type {{basic_price: number, type: string, discount_value: number}}
		 */
		//@ts-ignore
		const attrs = this.getSafeAttrs();

		let discountAmount = null,
			discountPercent = null
		;

		if (attrs.type == 'amount') {
			discountAmount = attrs.discount_value;
		} else if (attrs.type == 'percentage') {
			discountPercent = attrs.discount_value;
		}

		const finalPrice = calcFinalPrice(attrs.basic_price, discountAmount, discountPercent);

		const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.orderId);
		await orderItems.updatePrice(this.record.item_id, {
			basic_price: attrs.basic_price,
			final_price: finalPrice,
			discount_amount: discountAmount,
			discount_percent: discountPercent
		});

		const item = await this.loadOrderItemByPk();
		if (item) {
			this.record = item;
		}

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.orderId,
			{items: await orderItems.getItems()}
		);
	}

	rawOptions() {
		return {
			type: [
				['no', this.__('No discount')],
				['amount', this.__('Amount')],
				['percentage', this.__('Percentage')],
			]
		};
	}

	async getTplData() {
		const data = await super.getTplData();

		let title;
		if (this.record.type == 'custom_item') {
			title = this.record.custom_item.title;
		} else if (this.record.type == 'variant') {
			title = `${this.record.product.title}, ${this.record.variant.title}`;
		} else if (this.record.type == 'product') {
			title = this.record.product.title;
		}

		//@ts-ignore
		data.title = title;
		//@ts-ignore
		data.orderId = this.orderId;

		return data;
	}

	validateDiscountVal(value) {
		if (this.attributes.type !== 'no' && typeof(value) !== 'number') {
			this.addError('discount_value', 'required', this.__('Value cannot be blank.'));
			return;
		}

		let max = null;
		if (this.attributes.type === 'amount') {
			max = Number(this.record.basic_price);
		} else if (this.attributes.type === 'percentage') {
			max = 100;
		}

		if (max !== null && value > max) {
			this.addError('discount_value', 'moreThan', this.__('Value should be less than %s', [max]));
			return;
		}
	}

	async loadOrderItemByPk() {
		const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.orderId);

		//@ts-ignore
		const [item] = await orderItems.getItems({item_id: this.pk});
		if (item) {
			return item;
		}

		return null;
	}
}