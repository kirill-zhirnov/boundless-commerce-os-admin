// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');

class PickupPoint extends DataProvider {
	constructor() {
		super(...arguments);

		this.paymentMethodAlias = null;
	}

	getRules() {
		return [
			['city, point, paymentMethod', 'isNum'],
			['delivery', 'safe'],
			['paymentMethod', 'validatePaymentMethod']
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		this.q.field('delivery_id');

		this.q.field('shipping_pickup.point_id');
		this.q.field('shipping_pickup.city_id');
		this.q.field('shipping_pickup.local_id');
		this.q.field('shipping_pickup.coordinate');
		this.q.field('shipping_pickup.possibility_to_pay_for_order');

		this.q.field('shipping_pickup_text.title');
		this.q.field('shipping_pickup_text.address');
		this.q.field('shipping_pickup_text.phone');
		this.q.field('shipping_pickup_text.work_schedule');

		this.q.from('delivery');
		this.q.join('shipping_pickup', null, 'delivery.shipping_id = shipping_pickup.shipping_id');
		this.q.join('shipping_pickup_text', null, 'shipping_pickup.point_id = shipping_pickup_text.point_id');

		this.q.where('delivery.deleted_at is null');
		this.q.where('shipping_pickup.deleted_at is null');
		this.q.where('shipping_pickup.city_id = ?', this.getSafeAttr('city'));
		this.q.where('shipping_pickup_text.lang_id = ?', this.getLang().lang_id);

		let delivery = this.getSafeAttr('delivery');
		if (delivery) {
			delivery = String(delivery).split('.')[0];
			this.q.where('delivery.delivery_id = ?', delivery);
		}

		if (this.paymentMethodAlias === 'cashOnDelivery') {
			this.q.where('shipping_pickup.possibility_to_pay_for_order = true');
		}

		this.q.order('shipping_pickup_text.title');

		return this.compare('shipping_pickup.point_id', this.getSafeAttr('point'));
	}

	getPageSize() {
		return false;
	}

	setupPaymentMethodByAlias(paymentMethod) {
		returnthis.getDb().sql(`\
select \
alias \
from \
payment_gateway \
inner join payment_method using(payment_gateway_id) \
where \
payment_method_id = :paymentMethod\
`, {
			paymentMethod
		})
		.then(rows => {
			if (rows[0]) {
				this.paymentMethodAlias = rows[0].alias;
			}

		});
	}

	validatePaymentMethod(val) {
		if (this.hasErrors('paymentMethod') || !val) {
			return;
		}

		return this.setupPaymentMethodByAlias(val);
	}
}

module.exports = PickupPoint;