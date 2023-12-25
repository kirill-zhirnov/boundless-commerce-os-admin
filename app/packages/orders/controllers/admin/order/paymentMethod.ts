import BasicAdmin from '../../../../system/controllers/admin';
import {IOrdersModel, IOrdersModelStatic} from '../../../models/orders';
import * as orderEvents from '../../../components/orderEventNotification';
import {diff} from 'deep-object-diff';

export default class PaymentMethodController extends BasicAdmin {
	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/order/paymentMethod', {}, {
			beforeJson(result, closeModal, kit, form) {
				Object.assign(result.json, {
					//@ts-ignore
					paymentMethod: form.getPaymentMethod()
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal('form', {data}, this.__('Specify payment method'));
		}
	}

	async postActionRm() {
		const order = await this.getModel('orders').findException({
			where: {
				order_id: this.getParam('order')
			}
		}) as IOrdersModel;

		const prevOrder = order.toJSON();
		order.payment_method_id = null;
		await order.save();

		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), order.order_id);
		await order.reload();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			order.order_id,
			diff(prevOrder, order.toJSON())
		);

		this.json(true);
	}
}