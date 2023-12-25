const pathAlias = require('path-alias');
const BasicGateway = require('./basic');
const errors = pathAlias('@errors');
const crypto = require('crypto');
const Q = require('q');
const accounting = require('accounting');
const _ = require('underscore');
const ReceiptItems = require('../modules/receiptItems')
const env = require('../../../modules/env')

class RoboKassaGateway extends BasicGateway {
	constructor(...args) {
		super(...args);

		if (!this.paymentMethod.config)
			throw new Error("Payment method is not configured");

		({
			merchantLogin: this.merchantLogin,
			password1: this.password1,
			password2: this.password2,
			testMode: this.testMode,
			makeReceipt: this.makeReceipt,
			testPassword1: this.testPassword1,
			testPassword2: this.testPassword2,
			sno: this.sno,
			additionalParams: this.additionalParams,
			onlineReceipt: this.onlineReceipt
		} = this.paymentMethod.config);
	}

	/**
	 * Returns object with outgoing params.
	 *
	 * @returns {*}
	 */
	createRequestParams() {
		let params;

		return this.isAllowedToPayForOrder()
		.then(() => {
			return this.createPaymentTransaction();
		})
		.then(() => {
			params = {
				MerchantLogin: this.merchantLogin,
				OutSum: accounting.formatNumber(this.order.order.total_price, 2, ''),
				InvId: this.paymentTransaction.payment_transaction_id,
				InvDesc: this.i18n.__('Payment for order #%s', [this.order.order.order_id]),
				Encoding: 'utf-8',
				UserIp: this.getClientIp()
			};

			if (this.makeReceipt)
				return this.makeReceiptParam();
		})
		.then((val) => {
			if (this.makeReceipt)
				params.Receipt = encodeURIComponent(JSON.stringify(val));

			params.SignatureValue = this.makeSignature(params, [
				'MerchantLogin',
				'OutSum',
				'InvId',
				'UserIp',
				'Receipt',
				'password1'
			]);

			if (this.testMode)
				params.IsTest = '1';

			let profile = this.user.getState('profile');
			if (profile.email)
				params.Email = profile.email;

			//if additional params are specified - extend it (but not replace main)
			if (this.additionalParams)
				_.defaults(params, this.additionalParams);

			return this.logPaymentRequest(params);
		})
		.then(() => {
			return params;
		})
	}

	makeReceiptParam() {
		if (!this.sno)
			return Q.reject(new Error('SNO is not filled!'));

		let receipt = {
			sno: this.sno,
			items: []
		};

		return env.create(this.instanceRegistry)
			.setClientRegistry(this.clientRegistry)
			.getEnv()
			.then((envValue) => {
				let receiptItems = new ReceiptItems(envValue, this.order);
				receiptItems.getReceiptItems().forEach((row) => {
					let item = {
						name: row.title,
						quantity: Number(row.qty),
						sum: Number(row.sum),
						payment_method: 'full_payment',
						tax: this.getRoboVat(row.vat)
					};

					switch (row.type) {
						case 'product':
							item.payment_object = this.onlineReceipt.paymentSubjectType.product;
							break;

						case 'service':
							item.payment_object = 'service';
							break;

						case 'paymentMarkUp':
						case 'adjustment':
							item.payment_object = 'another';
							break;
					}

					receipt.items.push(item);
				});

				return receipt;
			});
	}

	makeSignature(params, keysSequence) {
		let values = [];
		keysSequence.forEach((fieldName) => {
			switch (fieldName) {
				case 'password1':
					values.push(
						(this.testMode) ? this.testPassword1 : this.password1
					);
					break;

				case 'password2':
					values.push(
						(this.testMode) ? this.testPassword2 : this.password2
					);
					break;

				default:
					if (fieldName in params) {
						values.push(params[fieldName]);
					}
					break;
			}
		});

		const sha512Hash = crypto.createHash('sha512');
		sha512Hash.update(values.join(':'));

		return sha512Hash.digest('hex');
	}

	isAllowedToPayForOrder() {
		return super.isAllowedToPayForOrder()
		.then(() => {
			if (this.instanceRegistry.getCurrency().code != 643)
				throw new errors.HttpError(400, 'Robokassa is allowed to pay only in Roubles!');
		})
	}

	getRequestAction() {
		return 'https://auth.robokassa.ru/Merchant/Index.aspx';
	}

	processResultCallback(inputParams) {
		let deferred = Q.defer(),
			result = {
				status: null,
				response: null
			};

		this.reqParams = inputParams;
		this.findPaymentTransaction(inputParams.InvId, {status: 'awaitingForCallback'})
		.then((row) => {
			if (!row)
				return Q.reject(new Error('Transaction not found or it was already processed.'));

			return this.validateResultCallbackParams();
		})
		.then(() => {
			return this.markCompleted();
		})
		.then(() => {
			result.status = true;
			result.response = `OK${this.paymentTransaction.payment_transaction_id}`;

			deferred.resolve(result);
		})
		.catch((e) => {
			console.error('Error in Robokasa.processResultCallback:', e, 'given params:', inputParams);

			result.status = false;
			result.response = 'Error processing callback';

			deferred.resolve(result);
		});

		return deferred.promise;
	}

	validateResultCallbackParams() {
		if (Number(this.paymentTransaction.total_amount) != Number(this.reqParams.OutSum))
			return Q.reject(new Error(`Amounts are not equal. Expecting: '${this.paymentTransaction.total_amount}', got '${this.reqParams.OutSum}'`));

		let sign = this.makeSignature(this.reqParams, [
			'OutSum',
			'InvId',
			'password2'
		]);

		if (sign.toLowerCase() != String(this.reqParams.SignatureValue).toLowerCase())
			return Q.reject(new Error(`Signature is incorrect.`));

		if (this.testMode && this.reqParams.IsTest != '1')
			return Q.reject(new Error(`Payment method in test mode. Expecting to have special parameter in request.`));

		return Q.resolve();
	}

	processSuccessCallback(inputParams) {
		let deferred = Q.defer(),
			result = {
				status: null,
				redirect: null
			}
		;

		this.reqParams = inputParams;
		this.findPaymentTransaction(inputParams.InvId)
		.then((row) => {
			if (!row)
				return Q.reject(new Error('Transaction not found or it was already processed.'));

			return this.validateSuccessCallbackParams();
		})
		.then(() => {
			result.status = true;
			result.redirect = {
				route: 'orders/thankYou/paid',
				params: {
					id: this.paymentTransaction.order_id
				}
			};

			deferred.resolve(result);
		})
		.catch((e) => {
			console.error('Error in Robokasa.processSuccessCallback:', e, 'given params:', inputParams);

			result.status = false;

			deferred.resolve(result);
		});


		return deferred.promise;
	}

	validateSuccessCallbackParams() {
		if (Number(this.paymentTransaction.total_amount) != Number(this.reqParams.OutSum))
			return Q.reject(new Error(`Amounts are not equal. Expecting: '${this.paymentTransaction.total_amount}', got '${this.reqParams.OutSum}'`));

		let sign = this.makeSignature(this.reqParams, [
			'OutSum',
			'InvId',
			'password1'
		]);

		if (sign.toLowerCase() != String(this.reqParams.SignatureValue).toLowerCase())
			return Q.reject(new Error(`Signature is incorrect.`));

		return Q.resolve();
	}

	getRoboVat(vat) {
		switch (vat) {
			case 'noVat':
				return 'none'

			case 'vat0':
				return 'vat0';

			case 'vat10Receipt':
				return 'vat10';

			case 'vat18Receipt':
				return 'vat18';

			case 'vat20Receipt':
				return 'vat20';

			case 'vat10/110':
				return 'vat110';

			case 'vat18/118':
				return 'vat118';

			case 'vat20/120':
				return 'vat120';
		}
	}
}

module.exports = RoboKassaGateway;