import PaymentMethodBasicForm from './basicPaymentForm.client';

export default class PaypalPaymentForm extends PaymentMethodBasicForm {
	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('payment/admin/paymentMethod/paypal'),
			class: 'paypal-form'
		});
	}

	run() {
		return this.render('paypalPaymentForm');
	}

	getFileName() {
		return __filename;
	}
}