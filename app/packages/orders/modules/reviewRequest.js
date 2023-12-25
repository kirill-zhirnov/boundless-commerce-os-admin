const Component = require('../../../modules/component');
const _ = require('underscore');
const RequestForReviewNotification = require('../notifications/requestForReview');

class ReviewRequest extends Component {
	constructor(env) {
		super(env);

		this.requestForReviewSetting = null;
	}

	async make() {
		this.requestForReviewSetting = await this.getSetting('orders', 'requestForReview');
		if (!this.requestForReviewSetting.isActive)
			return;

		const orderIds = await this.findOrdersForRequest();
		for (const orderId of orderIds) {
			await this.notify(RequestForReviewNotification, 'requested', orderId);
		}
	}

	async findOrdersForRequest() {
		const statusId = this.requestForReviewSetting.sendOnStatusId;

		const rows = await this.getDb().sql(`
			select
				orders.order_id
			from
				orders
				inner join (
					select
						order_id,
						max(changed_at) as last_changed_at
					from
						order_history
					where
						status_id = :status
					group by order_id
				) orders_last_change on orders_last_change.order_id = orders.order_id
				inner join person on person.person_id = orders.customer_id and person.email is not null
				left join (
					select
						essence_id,
						max(sent_at) as last_sent_at,
						count(*) as total_sent
					from
						notification_history
					where
						type = 'orderReviewRequest'
					group by essence_id
				) notifications_sent on notifications_sent.essence_id = orders.order_id
			where
				status_id = :status
				and (
					notifications_sent.total_sent is null
					or notifications_sent.total_sent <= :maxAttempts
				)
				and (
					notifications_sent.last_sent_at is null
					or notifications_sent.last_sent_at + interval :intervalRepeatDelay <= now()
				)
				and orders_last_change.last_changed_at + interval :intervalSendDelay <= now()
				and not exists (
					select 1 from product_review where order_id = orders.order_id and status != 'draft'
				)
		`, {
			status: statusId,
			maxAttempts: this.requestForReviewSetting.repeatRequestQty,
			intervalRepeatDelay: `${this.requestForReviewSetting.repeatDelay} second`,
			intervalSendDelay: `${this.requestForReviewSetting.sendDelay} second`
		});

		return _.pluck(rows, 'order_id');
	}
}

module.exports = ReviewRequest;