const pathAlias = require('path-alias');
const errors = pathAlias('@errors');
const Q = require('q');
const I18nKit = pathAlias('@modules/i18n/kit/server');

class BasicGateway {
	/**
	 *
	 * @param instanceRegistry
	 * @param paymentMethod - result, received from this.getModel('paymentMethod').findByAlias()
	 * @param user - this.getUser()
	 * @param order - result, received from this.getModel('orders').loadOrderPage()
	 */
	constructor(instanceRegistry, paymentMethod, user = null, order = null) {
		this.instanceRegistry = instanceRegistry;
		this.paymentMethod = paymentMethod;
		this.order = order;
		this.user = user;

		this.db = this.instanceRegistry.getDb();
		this.settings = this.instanceRegistry.getSettings();

		let i18nKit = new I18nKit();
		this.i18n = i18nKit.createDefaultI18n();

		this.expressRequest = null;
		this.paymentTransaction = null;
		this.reqParams = null;

		this.clientRegistry = null;
	}

	isAllowedToPayForOrder() {
		if (this.order.order.customer_id != this.user.getId())
			throw new errors.HttpError(403, 'You are not an owner of the order!');

		if (this.order.order.paid_at)
			throw new errors.HttpError(400, 'The order is already paid');

		return this.settings.get('orders', 'need_order_confirmation')
		.then((needConfirmation) => {
			if (needConfirmation && !this.order.order.confirmed_at)
				throw new errors.HttpError(400, 'Order is not confirmed - cannot process payment.');
		});
	}

	setI18n(i18n) {
		this.i18n = i18n;

		return this;
	}

	setExpressRequest(val) {
		this.expressRequest = val;

		return this;
	}

	getClientIp() {
		return this.expressRequest.headers['x-forwarded-for'];
	}

	createPaymentTransaction(attrs = {}) {
		return Q()
		.then(() => {
			return this.db.model('paymentTransaction')
			.create(Object.assign({
				payment_method_id: this.paymentMethod.payment_method_id,
				status: 'awaitingForCallback',
				mark_up_amount: this.order.order.payment_mark_up,
				total_amount: this.order.order.total_price,
				currency_id: this.instanceRegistry.getCurrency().currency_id,
				order_id: this.order.order.order_id,
				person_id: this.user.getId()
			}, attrs))
		})
		.then((row) => {
			this.paymentTransaction = row;

			return this.paymentTransaction;
		});
	}

	findPaymentTransaction(id, where = {}) {
		where = Object.assign({
			payment_transaction_id: id,
			payment_method_id: this.paymentMethod.payment_method_id
		}, where);

		return Q(this.db.model('paymentTransaction').findOne({
			where: where
		}))
		.then((row) => {
			this.paymentTransaction = row;

			return row;
		});
	}

	logPaymentRequest(requestParams) {
		return Q(this.db.model('paymentRequest').create({
			payment_transaction_id: this.paymentTransaction.payment_transaction_id,
			request: requestParams
		}));
	}

	logPaymentCallback(params, trx = null) {
		let attrs = {
			response: params
		};

		if (this.paymentTransaction)
			attrs.payment_transaction_id = this.paymentTransaction.payment_transaction_id;

		return Q(this.db.model('paymentCallback').create(attrs, {
			transaction: trx
		}))
	}

	/**
	 * Mark transaction completed, order paid and log payment callback.
	 */
	markCompleted() {
		let trx,
			deferred = Q.defer();

		Q(this.db.transaction({autocommit: false}))
		.then((t) => {
			trx = t;

			return this.paymentTransaction
				.set({status: 'completed'})
				.save({transaction: trx});
		})
		.then(() => {
			return this.db.model('orders').update({
				paid_at: this.db.fn('NOW')
			}, {
				where: {
					order_id: this.paymentTransaction.order_id
				},
				transaction: trx
			})
		})
		.then(() => {
			return this.logPaymentCallback(this.reqParams, trx);
		})
		.then(() => {
			return trx.commit()
		})
		.then(() => {
			trx = null;
			deferred.resolve();
		})
		.catch((e) => {
			Q()
			.then(() => {
				if (trx)
					return trx.rollback()
			})
			.fin(() => {
				deferred.reject(e);
			})
			.done();
		})
		.done();

		return deferred.promise;
	}

	setClientRegistry(value) {
		this.clientRegistry = value;

		return this;
	}
}

module.exports = BasicGateway;