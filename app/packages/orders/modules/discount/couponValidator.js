const pathAlias = require('path-alias');
const Component = pathAlias('@modules/component');
const Q = require('q');

class CouponValidator extends Component {
	constructor(env, code, orderSummary, customerId) {
		super(env);

		this.code = code;
		this.orderSummary = orderSummary;
		this.customerId = customerId;

		this.couponRow = null;
		this.errors = [];
	}

	validate() {
		let deferred = Q.defer();

		this.getDb().sql(`
			select
				*
			from
				coupon_code
				inner join coupon_campaign using(campaign_id)
			where
				coupon_code.code = :code
				and coupon_campaign.deleted_at is null
		`, {
			code: this.code
		})
			.then((rows) => {
				if (!rows.length) {
					this.errors.push(this.__('Discount code is not found.'));
					return Q.reject('notValid');
				}

				this.couponRow = rows[0];
				if (this.couponRow.min_order_amount && this.couponRow.min_order_amount > this.orderSummary.total) {
					this.errors.push(this.__('Minimum order amount for given coupon is %s', [this.getLocale().formatMoney(this.couponRow.min_order_amount)]));
					return Q.reject('notValid');
				}

				return this.validateLimits();
			})
			.then(() => {
				let out = this.errors.length ? false : true;

				deferred.resolve(out);
			})
			.catch((e) => {
				if (e === 'notValid') {
					deferred.resolve(false);
				} else {
					throw e;
				}
			});

		return deferred.promise;
	}

	validateLimits() {
		if (!this.couponRow.limit_usage_per_code && !this.couponRow.limit_usage_per_customer)
			return Q();

		return this.getDb().sql(`
			select
				count(*) coupon_used,
				coalesce(sum(
					case
						when customer_id = :customerId then 1
						else 0
					end
				), 0)::integer as customer_used
			from
				order_discount
				inner join orders using(order_id)
				inner join order_status using(status_id)
			where
				code_id = :codeId
				and order_status.alias not in ('cancelled')
		`, {
			customerId: this.customerId,
			codeId: this.couponRow.code_id
		})
			.then((rows) => {
				let row = rows[0];
				if (this.couponRow.limit_usage_per_code
					&& row.coupon_used >= this.couponRow.limit_usage_per_code
				) {
					this.errors.push(this.__('The discount code has already been used.'));
					return;
				}

				if (this.couponRow.limit_usage_per_customer
					&& row.customer_used >= this.couponRow.limit_usage_per_customer
				) {
					this.errors.push(this.__('The discount code cannot be used more than %s time(s) per customer.', [this.couponRow.limit_usage_per_customer]));
					return;
				}
			});
	}

	getFirstError() {
		return this.errors[0];
	}

	getCouponRow() {
		return this.couponRow;
	}
}

module.exports = CouponValidator;
