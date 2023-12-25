import Form from '../../../../modules/form/index';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import {Op} from 'sequelize';
import {TPublishingStatus} from '../../../../@types/db';
import {TQueueEventType} from '../../../../@types/rabbitMq';
import {diff} from 'deep-object-diff';
import {ITaxClass} from '../../../../@types/system';

export default class Order extends Form<{}, IOrdersModel> {
	protected orderBeforeSave: {[key: string]: any};

	async loadRecord() {
		const row = await this.findOrder();
		this.orderBeforeSave = row.toJSON();

		return row;
	}

	async getTplData() {
		const out = await super.getTplData();

		const rows = await this.getModel('taxClass').findAll({
			include: [{model: this.getModel('taxRate')}],
			order: [[this.getModel('taxRate'), 'priority', 'asc']],
		});
		const taxClasses = rows.map(row => row.toJSON()) as ITaxClass[];

		Object.assign(out, {
			record: this.record.toJSON(),
			orderIsLocked: this.record.isLocked(),
			trackInventory: await this.getSetting('inventory', 'trackInventory'),
			taxSettings: await this.getSetting('system', 'tax'),
			taxClasses
		});

		return out;
	}

	async setupChildFormKit(childFormKit) {
		const form = await childFormKit.getForm();

		if (typeof(form.setOrderRecord) === 'function') {
			await form.setOrderRecord(this.record);
		}
	}

	async onFormsGroupSaved() {
		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.pk as number);

		const orderAfterSave = await this.findOrder();
		if (orderAfterSave.isDraft()) {
			return;
		}

		const event = this.orderBeforeSave.publishing_status === TPublishingStatus.draft && orderAfterSave.publishing_status !== TPublishingStatus.draft
			? TQueueEventType.created
			: TQueueEventType.updated
		;

		const eventPublisher = this.getInstanceRegistry().getEventPublisher();
		const data = {
			model: 'orders',
			pkList: [this.record.order_id],
			diff: diff(this.orderBeforeSave, orderAfterSave.toJSON()),
			userId: this.getUser().getId(),
			notify: {
				admin: false,
				client: true
			}
		};

		switch (event) {
			case TQueueEventType.created:
				this.triggerClient('refreshed.basket');
				await eventPublisher.modelCreated(data);
				break;

			case TQueueEventType.updated:
				await eventPublisher.modelChanged(data);
				break;
		}
	}

	async findOrder(): Promise<IOrdersModel> {
		return await (this.getModel('orders') as IOrdersModelStatic).findException({
			include: [
				{
					model: this.getModel('orderProp')
				},
				{
					model: this.getModel('reserve')
				},
				{
					model: this.getModel('paymentMethod'),
					required: false,
					include: [
						{
							model: this.getModel('paymentMethodText'),
							required: false,
							where: {
								lang_id: this.getEditingLang().lang_id
							}
						}
					]
				}
			],
			where: {
				[Op.and]: [
					{order_id: this.pk},
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