import CustomerForm from '../../../customer/forms/admin/customer';
import {IFormOptions} from '../../../../modules/form';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import {TPublishingStatus} from '../../../../@types/db';
import {IPersonModel, IPersonModelStatic} from '../../../customer/models/person';
import * as orderEvents from '../../components/orderEventNotification';
import * as eventNotification from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';


export default class OrderCustomerForm extends CustomerForm {
	protected order: IOrdersModel;
	protected customerBeforeSave: number|null = null;

	constructor(options: IFormOptions<IPersonModel> & {order: IOrdersModel}) {
		super(options);

		this.order = options.order;
	}

	getRules() {
		return [
			['fill_shipping_address', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	async save() {
		this.customerBeforeSave = this.order.customer_id || null;
		const wasDraft = !this.record;
		this.record = this.record || (this.getModel('person') as IPersonModelStatic).build().set({
			site_id: this.getEditingSite().site_id,
			status: TPublishingStatus.draft,
			created_by: this.getUser().getId()
		});

		await super.save();

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			wasDraft ? TQueueEventType.created : TQueueEventType.updated,
			this.record.person_id
		);

		await this.order.set({customer_id: this.record.person_id}).save();

		//need to recalc - incase taxes depends on address
		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.order.order_id);

		if (this.customerBeforeSave !== this.record.person_id) {
			await orderEvents.notifyOrderChanged(
				this.getInstanceRegistry(),
				this.getUser().getId(),
				this.order.order_id,
				{customer_id: this.record.person_id}
			);
		}
	}

	async getTplData() {
		const data = await super.getTplData();

		if (this.order) {
			Object.assign(data, {
				order: this.order.toJSON()
			});
		}

		return data;
	}

	async prepareChildForm(childForm) {
		if (typeof (childForm.setPerson) === 'function') {
			childForm.setPerson(this.record);
		}

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		if (attrs.fill_shipping_address == '1' && typeof (childForm.setPerson) === 'function') {
			childForm.setCreateNewAddress(true);
		}
	}
}