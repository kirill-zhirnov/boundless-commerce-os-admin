import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';

export default class PaymentMethodBasicForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('payment/admin/paymentMethod/form')
		});
	}

	events() {
		return _.extend(super.events(), {
			'change input[name="for_all_delivery"]': () => {
				const $block = this.$('.specify-delivery');

				if (this.$('input[name="for_all_delivery"]').is(':checked')) {
					if (!$block.hasClass('none')) {
						return $block.addClass('none');
					}
				} else {
					return $block.removeClass('none');
				}
			}
		});
	}

	run() {
		return this.render('basicPaymentForm');
	}

	getFileName() {
		return __filename;
	}
}