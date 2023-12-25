import FormWidget from '../../../modules/widget/form.client';

export default class WebhookForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			class: 'webhook-form',
			action: this.url('system/admin/webhook/form')
		});
	}

	events() {
		return Object.assign(super.events(), {
			'change input[name="sign"]': (e) => {
				const $elem = this.$(e.currentTarget);
				const $secret = this.$('.secret-field');
				if ($elem.is(':checked')) {
					$secret.show();
				} else {
					$secret.hide();
				}
			},
		});
	}

	run() {
		return this.render('webhookForm', this.data);
	}

	getFileName() {
		return __filename;
	}
}