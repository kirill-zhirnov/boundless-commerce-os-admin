import BasicAdmin from '../../../../system/controllers/admin';
import {IOrderDiscountModelStatic, IOrderDiscountModel} from '../../../models/orderDiscount';
import {ICouponCodeModelStatic} from '../../../models/couponCode';
import {IOrdersModelStatic} from '../../../models/orders';
import * as orderEvents from '../../../components/orderEventNotification';

export default class DiscountController extends BasicAdmin {
	async actionList() {
		const orderId = parseInt(this.getParam('order'));

		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}

		const discounts = await this.loadAllDiscounts(orderId);

		this.json({discounts});
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/order/discount', {
			orderId: this.getParam('order')
		}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				const discount = await form.getRecord();
				Object.assign(result.json, {
					discount
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add discount') : this.__('Edit discount');
			this.modal('form', {data}, title);
		}
	}

	async postActionRm() {
		const discountId = parseInt(this.getParam('id'));

		if (!discountId) {
			this.json({result: false});
			return;
		}

		const orderDiscount = await this.getModel('orderDiscount').findException({
			where: {
				discount_id: discountId
			}
		}) as IOrderDiscountModel;

		const {order_id} = orderDiscount;
		await orderDiscount.destroy();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			order_id,
			{discounts: await this.loadAllDiscounts(order_id)}
		);

		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), order_id);

		this.json({result: true});
	}

	protected loadAllDiscounts(orderId: number) {
		return (this.getModel('orderDiscount') as IOrderDiscountModelStatic).findAll({
			include: [
				{model: this.getModel('couponCode') as ICouponCodeModelStatic}
			],
			where: {
				order_id: orderId
			},
			order: [['created_at', 'asc']]
		});
	}
}