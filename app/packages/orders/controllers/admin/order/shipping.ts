import BasicAdmin from '../../../../system/controllers/admin';
import {IOrderServiceDeliveryModelStatic} from '../../../models/orderServiceDelivery';
import {IOrderServiceModelStatic} from '../../../models/orderService';
import * as orderEvents from '../../../components/orderEventNotification';
import {IOrdersModelStatic} from '../../../models/orders';

export default class OrderShippingController extends BasicAdmin {
	async actionData() {
		const OrderServiceDelivery = this.getModel('orderServiceDelivery') as IOrderServiceDeliveryModelStatic;

		const shipping = await OrderServiceDelivery.fetchShippingByOrderId(
			this.getParam('order'),
			this.getEditingLang().lang_id
		);

		this.json({shipping});
	}

	async actionEdit() {
		const formKit = this.createFormKit('@p-orders/forms/order/shipping', {
			orderId: this.getParam('order')
		}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				Object.assign(result.json, {
					//@ts-ignore
					shipping: await this.getModel('orderServiceDelivery').fetchShippingByOrderId(form.orderId, this.getEditingLang().lang_id)
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add shipping') : this.__('Edit shipping');
			this.modal('edit', {data}, title);
		}
	}

	async actionRm() {
		const OrderServiceDelivery = this.getModel('orderServiceDelivery') as IOrderServiceDeliveryModelStatic;
		const OrderService = this.getModel('orderService') as IOrderServiceModelStatic;

		const orderId = parseInt(this.getParam('order'));
		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}
		const shipping = await OrderServiceDelivery.fetchShippingByOrderId(orderId, this.getEditingLang().lang_id);

		if (shipping) {
			await OrderService.destroy({
				where: {
					order_service_id: shipping.order_service_id,
					order_id: orderId
				}
			});

			//need to recalc - incase taxes depends on address
			await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), orderId);
		}

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			orderId,
			{shipping: null}
		);

		this.json(true);
	}
}