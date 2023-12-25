import Form from '../../../../modules/form';
import {IPaymentMethodModel, IPaymentMethodModelStatic} from '../../../payment/models/paymentMethod';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import * as orderEvents from '../../components/orderEventNotification';
import {diff} from 'deep-object-diff';

interface IAttrs {
	payment_method_id: number|null
}

export default class PaymentMethodForm extends Form<IAttrs, IOrdersModel> {
	protected paymentMethod: IPaymentMethodModel|null = null;

	getRules() {
		return [
			['payment_method_id', 'required'],
			['payment_method_id', 'inOptions', {options: 'paymentMethod'}],
		];
	}

	async loadRecord() {
		return await (this.getModel('orders') as IOrdersModelStatic).findException({
			where: {
				order_id: this.pk
			}
		}) as IOrdersModel;
	}

	async save() {
		const prevOrder = this.record.toJSON();

		this.record.payment_method_id = this.getSafeAttr('payment_method_id');
		await this.record.save();

		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.record.order_id);
		await this.record.reload();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.record.order_id,
			diff(prevOrder, this.record.toJSON())
		);

		this.paymentMethod = await this.getModel('paymentMethod').findOne({
			include: [
				{
					model: this.getModel('paymentMethodText')
				}
			],
			where: {
				payment_method_id: this.record.payment_method_id
			}
		}) as IPaymentMethodModel;
	}

	rawOptions() {
		return {
			paymentMethod: (this.getModel('paymentMethod') as IPaymentMethodModelStatic)
				.findAllOptions(this.getEditingLang().lang_id, [], true)
		};
	}

	getPaymentMethod(): IPaymentMethodModel|null {
		return this.paymentMethod;
	}
}