import BasicAdmin from '../../../../system/controllers/admin';
import {IOrdersModel, IOrdersModelStatic} from '../../../models/orders';
import {Op} from 'sequelize';
import {TPublishingStatus} from '../../../../../@types/db';
import {TAddressType} from '../../../../../@types/person';
import {notifyOrderChanged} from '../../../components/orderEventNotification';

export default class OrderCustomerController extends BasicAdmin {
	async actionFetch() {
		const orderId = parseInt(this.getParam('order'));
		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}

		const order = await this.findOrder(orderId);
		this.json({person: order.person});
	}

	async postActionSet() {
		const orderId = parseInt(this.getParam('order'));
		const personId = parseInt(this.getParam('person'));
		if (isNaN(orderId) || isNaN(personId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}

		const order = await this.findOrder(orderId);
		await order.set({customer_id: personId}).save();
		//need to recalc - incase taxes depends on address
		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), orderId);

		await notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			orderId,
			{customer_id: personId}
		);

		this.json(true);
	}

	async actionForm() {
		const orderId = parseInt(this.getParam('order'));
		const personId = parseInt(this.getParam('pk'));
		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}
		const order = await this.findOrder(orderId);

		const group = this.createFormsGroup({
			customer: {
				form: '@p-orders/forms/order/customer',
				options: {
					order,
				},
				children: {
					address: {
						form: '@p-orders/forms/order/customer/address',
						options: {
							personId
						}
					},
				}
			}
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();

			//@ts-ignore
			const title = (data.forms?.customer?.scenario === 'insert') ? this.__('Create a new customer') : this.__('Edit customer');
			this.modal('create', {data}, title);
		}
	}

	async actionAddressByType() {
		const orderId = parseInt(this.getParam('order'));
		const type = this.getParam('type');
		if (isNaN(orderId) || !['shipping', 'billing'].includes(type)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}
		const order = await this.findOrder(orderId);
		if (!order.person) {
			throw new Error('Order doesn\'t have a person relation');
		}

		const formKit = this.createFormKit('@p-orders/forms/order/customer/addressByType', {
			person: order.person, type, orderId
		}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				const address = await form.getRecord();
				Object.assign(result.json, {
					address
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			data.orderId = orderId;

			//@ts-ignore
			const title = (data.addressType == 'shipping') ? this.__('Shipping address') : this.__('Billing address');
			this.modal('addressByType', {data}, title);
		}
	}

	async actionRm() {
		const orderId = parseInt(this.getParam('order'));
		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}

		await (this.getModel('orders') as IOrdersModelStatic).update({
			customer_id: null
		}, {
			where: {
				order_id: orderId
			}
		});
		//need to recalc - incase taxes depends on address
		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), orderId);

		this.alertSuccess(this.__('Customer was successfully removed.'));

		await notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			orderId,
			{customer_id: null}
		);

		this.json({});
	}

	async findOrder(orderId: number): Promise<IOrdersModel> {
		return await (this.getModel('orders') as IOrdersModelStatic).findException({
			include: [
				{
					model: this.getModel('person'),
					required: false,
					include: [
						{
							model: this.getModel('personAddress'),
							required: false,
							where: {
								type: [TAddressType.shipping, TAddressType.billing]
							},
							include: [
								{
									model: this.getModel('vwCountry'),
									required: false,
									where: {
										lang_id: this.getEditingLang().lang_id
									}
								}
							]
						},
						{
							model: this.getModel('personProfile'),
							required: false,
						}
					]
				}
			],
			where: {
				[Op.and]: [
					{order_id: orderId},
					{
						[Op.or]: [
							{publishing_status: TPublishingStatus.published},
							{publishing_status: TPublishingStatus.draft, created_by: this.getUser().getId()},
						]
					}
				]
			},
		}) as IOrdersModel;
	}
}