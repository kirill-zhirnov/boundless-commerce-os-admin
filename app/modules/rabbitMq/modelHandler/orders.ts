import BasicModelHandler from './basic';
import {IOrderHistoryModelStatic} from '../../../packages/orders/models/orderHistory';
import {TQueueEventType} from '../../../@types/rabbitMq';
import OrdersCustomerMails from '../../../packages/orders/mails/customerMails';
import OrderAdminMails from '../../../packages/orders/mails/adminMails';

export default class OrdersHandler extends BasicModelHandler {
	async handle() {
		if (![TQueueEventType.updated, TQueueEventType.created].includes(this.type) || !('diff' in this.data)) {
			return;
		}

		const {diff: {status_id}, pkList, userId, notify} = this.data;
		if (!status_id) {
			return;
		}

		try {
			for (const orderId of pkList) {
				await (this.db.model('orderHistory') as IOrderHistoryModelStatic).build().set({
					order_id: orderId,
					status_id,
					person_id: userId || null
				}).save();
			}

			if (notify) {
				if (notify.admin) {
					await this.sendAdminNotifications(pkList);
				}

				if (notify.client) {
					await this.sendCustomerNotification(pkList, status_id);
				}
			}
		} catch (e) {
			console.error('Error processing orders change:', e);
		}
	}

	async sendAdminNotifications(pkList: number[]) {
		if (this.type === TQueueEventType.created) {
			for (const orderId of pkList) {
				try {
					const adminMail = new OrderAdminMails(this.instanceRegistry);
					await adminMail.sendNewOrderNotification(orderId);
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

	async sendCustomerNotification(pkList: number[], status_id: number) {
		for (const orderId of pkList) {
			try {
				const mails = new OrdersCustomerMails(this.instanceRegistry);
				await mails.sendNotificationEmail(orderId, this.type, status_id);
			} catch (e) {
				console.error(e);
			}
		}
	}
}