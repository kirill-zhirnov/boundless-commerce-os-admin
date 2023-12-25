import Backbone from '../backbone/index.client';
import ajax from '../ajax/kit.client';
import {clientRegistry} from '../registry/client/client.client';
import $ from 'jquery';

import SimpleForm from './simpleForm.client';

export default class SimpleFormGroup extends Backbone.View {
	submit(action = null) {
		if (!action)
			action = this.$el.data('form-group');

		let forms = {},
			data = {},
			isSuccess = true,
			browserErrorRes = {
				forms: {},
				browser: true
			}
		;

		this.$('form[name]').each((i, el) => {
			let $form = $(el);
			forms[$form.attr('name')] = new SimpleForm({el: el});
		});

		Object.keys(forms).forEach((key) => {
			forms[key].clearErrors();

			if (!forms[key].browserValidation()) {
				isSuccess = false;
				browserErrorRes.forms[key] = {};
			}

			data[key] = forms[key].$el.serializeObject();
		});

		if (!isSuccess) {
			return Promise.reject(browserErrorRes);
		}

		return new Promise((resolve, reject) => {
			ajax.post(action, data)
				.then((res) => {
					if (res._common && res._common.closeModal) {
						this.$el.trigger('close.modal');
					}

					resolve(res);
				})
				.catch((res) => {
					if ('forms' in res) {
						Object.keys(res.forms).forEach((key) => {
							if (key in forms) {
								let form = forms[key],
									data = res.forms[key]
								;

								form.triggerError(data);
								form.showErrors(data.errors);
							}
						});
					} else {
						const i18n = clientRegistry.getI18n();
						clientRegistry.getTheme().alertDanger(i18n.__('Error'));
					}

					reject(res);
				});
		});
	}
}