import BasicAdmin from '../../../../system/controllers/admin';
import {IOrderAttrsModelStatic} from '../../../models/orderAttrs';
import {IOrdersModel, IOrdersModelStatic} from '../../../models/orders';

export default class CustomAttrsController extends BasicAdmin {
	async actionList() {
		const attributes = await (this.getModel('orderAttrs') as IOrderAttrsModelStatic).findAll({
			order: [['sort', 'asc']]
		});

		const order = await (this.getModel('orders') as IOrdersModelStatic).findException({
			include: [
				{model: this.getModel('orderProp')}
			],
			where: {
				order_id: this.getParam('order')
			}
		}) as IOrdersModel;

		this.json({
			attributes,
			values: order.orderProp!.custom_attrs || {}
		});
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/setup/customAttr', {}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				const orderAttr = await form.getRecord();
				Object.assign(result.json, {
					orderAttr
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add custom attribute') : this.__('Edit custom attribute');
			this.modal('form', {data}, title);
		}
	}

	async actionRm() {
		const attr_id = this.getParam('id');
		const record = await (this.getModel('orderAttrs') as IOrderAttrsModelStatic).findOne({
			where: {
				attr_id
			}
		});

		if (record) {
			await this.getDb().sql(`
				update
					order_prop
				set
					custom_attrs = custom_attrs  - :key
			`, {
				key: record.key
			});

			await record.destroy();
		}

		this.json(true);
	}
}