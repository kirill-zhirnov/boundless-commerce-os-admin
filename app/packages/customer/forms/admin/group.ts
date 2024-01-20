import Form from '../../../../modules/form';
import {ICustomerGroupModel, ICustomerGroupModelStatic} from '../../models/customerGroup';
import {notifyEvent} from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export interface IAttrs {
	title: string;
	alias: string | null;
}

export default class CustomerForm extends Form<IAttrs, ICustomerGroupModel> {
	getRules() {
		return [
			['title', 'required'],
			['alias', 'trim'],
			['alias', 'isAlias'],
			['alias', 'isUnique', {
				field: 'alias',
				row: this.record,
				model: this.getModel('customerGroup')
			}],
		];
	}

	async save() {
		if (!this.record) {
			this.record = this.getModel('customerGroup').build() as ICustomerGroupModel;
		}

		const {title, alias} = this.getSafeAttrs();
		this.record.set({
			title, alias
		});
		await this.record.save();

		await notifyEvent(
			'customer_group',
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.scenario == 'insert' ? TQueueEventType.created : TQueueEventType.updated,
			[this.record.group_id]
		);
	}

	async loadRecord(): Promise<ICustomerGroupModel> {
		return await (this.getModel('customerGroup') as ICustomerGroupModelStatic).findException({
			where: {
				group_id: this.pk
			}
		}) as ICustomerGroupModel;
	}
}