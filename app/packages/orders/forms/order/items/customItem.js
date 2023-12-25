import Form from '../../../../../modules/form';
import {Op} from 'sequelize';
import OrderItems from '../../../components/orderItems';
import {ICustomItemModel} from '../../../../inventory/models/customItem'; //eslint-disable-line
import {IOrdersModel} from '../../../models/orders'; //eslint-disable-line
import * as orderEvents from '../../../components/orderEventNotification';

export default class OrderAddItemsModal extends Form {
	constructor(options) {
		super(options);

		/**
		 * @type {null|IOrdersModel}
		 */
		this.order = null;
		this.orderId = options.orderId || null;

		/**
		 * @type {null|ICustomItemModel}
		 */
		this.record = null;

		this.updatedItem = null;
	}

	getRules() {
		return [
			['title,price,qty', 'required'],
			['title', 'trim'],
			['qty', 'isNum', {min: 1, no_symbols: true}],
			['price', 'isDotNumeric', {min: 0}],
			['price', 'toNumber']
		];
	}

	async setup() {
		await super.setup();

		this.order = await this.loadOrder();
		if (this.record) {
			const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.order.order_id);
			const items = await orderItems.getItems({custom_item_id: this.record.custom_item_id});

			if (items[0]) {
				//@ts-ignore
				this.attributes.price = items[0].basic_price;
				//@ts-ignore
				this.attributes.qty = items[0].qty;
			}
		}
	}

	async loadRecord() {
		//@ts-ignore
		return this.getModel('customItem').findException({
			where: {
				custom_item_id: this.pk
			}
		});
	}

	async save() {
		if (this.order.isLocked()) {
			throw new Error('Order is locked. Cannot process.');
		}

		let isNew = false;
		const attrs = this.getSafeAttrs();
		if (!this.record) {
			isNew = true;
			//@ts-ignore
			this.record = this.getModel('customItem').build();
		}

		await this.record
			.set({
				//@ts-ignore
				title: attrs.title,
				//@ts-ignore
				price: attrs.price
			})
			.save()
		;

		const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.order.order_id);
		const inventoryItem = await this.getModel('inventoryItem').findOne({
			where: {
				custom_item_id: this.record.custom_item_id
			}
		});

		//if item is new - add it to order.
		//if item already exists - it should be already in the order.
		if (isNew) {
			//@ts-ignore
			await orderItems.addItem(inventoryItem.item_id, attrs.qty, {
				basic_price: this.record.price
			});
		} else {
			//@ts-ignore
			await orderItems.updatePrice(inventoryItem.item_id, {
				basic_price: attrs.price,
				final_price: attrs.price,
				discount_amount: null,
				discount_percent: null
			});
			await orderItems.bulkSetQty([{
				//@ts-ignore
				itemId: inventoryItem.item_id,
				//@ts-ignore
				qty: attrs.qty
			}]);
		}

		//@ts-ignore
		const updatedItems = await orderItems.getItems({item_id: inventoryItem.item_id});
		//@ts-ignore
		this.updatedItem = updatedItems[0];

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.order.order_id,
			{items: await orderItems.getItems()}
		);
	}

	async loadOrder() {
		//@ts-ignore
		return this.getModel('orders').findException({
			include: [
				{model: this.getModel('reserve')}
			],
			where: {
				order_id: this.orderId,
				[Op.or]: [
					{publishing_status: 'published'},
					{
						[Op.and]: [
							{publishing_status: 'draft'},
							{created_by: this.getUser().getId()}
						]
					}
				],
			}
		});
	}

	async getTplData() {
		const data = await super.getTplData();

		//@ts-ignore
		data.orderId = this.orderId;

		return data;
	}
}