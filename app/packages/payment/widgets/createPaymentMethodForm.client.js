import $ from 'jquery';
import FormWidget from '../../../modules/widget/form.client';

export default class CreatePaymentMethodForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('payment/admin/paymentMethod/addForm'),
			class: 'add-payment-method-form'
		});
	}

	events() {
		return Object.assign(super.events(), {
			'click a.list-group-item': (e) => {
				e.preventDefault();

				const $a = $(e.currentTarget);
				this.$('input[name="payment_gateway_id"]').val($a.data('id'));

				this.onSubmit();
			}
		});
	}

	run() {
		return this.render('createPaymentMethodForm');
	}

	getFileName() {
		return __filename;
	}
}