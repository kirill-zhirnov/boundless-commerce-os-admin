import Component from '../../../../modules/component';

const NewOrderNotification = require('../../notifications/newOrder');

export default class StatusChangerNotifier extends Component {
	constructor(env, orderId) {
		super(env);

		this.orderId = orderId;
	}

	async orderCreated(toStatusId, notifyAdmins = true) {
		await this.notify(NewOrderNotification, 'created', this.orderId, notifyAdmins);
		await this.statusChanged(toStatusId);
	}

	async statusChanged(toStatusId) {
		await this.getModel('smsEvent').sendByEventAlias('order_status_change', this.instanceRegistry, {
			orderId: this.orderId,
			clientRegistry: this.clientRegistry,
			orderStatusId: toStatusId
		});
	}
}