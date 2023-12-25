import BasicAdmin from '../../../../system/controllers/admin';
import OrderItems from '../../../components/orderItems';
import * as orderEvents from '../../../components/orderEventNotification';

export default class OrderItemsController extends BasicAdmin {
	async actionModal() {
		const formKit = this.createFormKit('@p-orders/forms/order/items/addModal');

		const data = await formKit.getWebForm();
		this.modal('add', {data}, this.__('Add products to order'), null, {
			setSize: 'large'
		});
	}

	async postActionAdd() {
		const formKit = this.createFormKit('@p-orders/forms/order/items/addModal', {}, {
			successMsg: this.__('Selected item(s) were successfully added.'),
			beforeJson: (result, closeModal, formKit, form) => {
				//@ts-ignore
				result.json.addedItems = form.addedItems;
			}
		});
		await formKit.process();
	}

	async actionList() {
		const order = parseInt(this.getParam('order'));
		if (!order) {
			this.rejectHttpError(400, 'incorrect input params');
			return;
		}
		const data = await this.loadItems(order);

		this.json(data);
	}

	async actionCustomItem() {
		const formKit = this.createFormKit('@p-orders/forms/order/items/customItem', {
			orderId: this.getParam('order')
		}, {
			beforeJson: (result, closeModal, formKit, form) => {
				Object.assign(result.json, {
					//@ts-ignore
					item: form.updatedItem
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Create custom item') : this.__('Edit custom item');
			this.modal('customItem', {data}, title);
		}
	}

	async postActionRm() {
		const orderId = parseInt(this.getParam('order'));
		let itemIds = this.getParam('items', []);

		if (!Array.isArray(itemIds) || !orderId) {
			this.rejectHttpError(400, 'incorrect input params');
		}

		itemIds = itemIds.map(itemId => parseInt(itemId)).filter(itemId => itemId && itemId > 0);

		const orderItems = new OrderItems(
			this.getInstanceRegistry(),
			this.getClientRegistry(),
			orderId
		);
		await orderItems.rmItems(itemIds);

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			orderId,
			{items: await orderItems.getItems()}
		);

		this.json({result: true});
	}

	async actionPrice() {
		const formKit = this.createFormKit('@p-orders/forms/order/items/price', {
			orderId: this.getParam('order'),
		}, {
			beforeJson: async (result, closeModal, formKit) => {
				const record = await (await formKit.getForm()).getRecord();

				//@ts-ignore
				result.json.price = {
					//@ts-ignore
					basic_price: record.basic_price,
					//@ts-ignore
					final_price: record.final_price
				};
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			this.modal('price', {data}, this.__('Edit price for "%s"', [data.title]), null, {
				// setSize: 'small'
			});
		}
	}

	async loadItems(orderId) {
		const orderItems = new OrderItems(
			this.getInstanceRegistry(),
			this.getClientRegistry(),
			orderId
		);

		return orderItems.getItems();
	}
}