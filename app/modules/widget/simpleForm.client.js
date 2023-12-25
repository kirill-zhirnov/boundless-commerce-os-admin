import Backbone from '../backbone/index.client';
import ajax from '../ajax/kit.client';
import {clientRegistry} from '../registry/client/client.client';
import _ from 'underscore';
import $ from 'jquery';

export default class SimpleForm extends Backbone.View {
	initialize() {
		this.$btns = null;
	}

	submit(action = null, refreshGrid = true, customData = null) {
		if (!action)
			action = this.$el.attr('action');

		const theme = clientRegistry.getTheme();
		const i18n = clientRegistry.getI18n();
		this.clearErrors();

		let data = customData || this.$(':input').serializeArray();
		this.disableButtons();

		//I tried to switch to native promises, but rejection always shows errors in console
		//We need to find a way avoiding errors on form validation.

		return new Promise((resolve, reject) => {
			ajax.post(action, data)
				.then((data) => {
					this.enableButtons();

					if (data.closeModal)
						this.$el.trigger('close.modal');

					if (refreshGrid && (this.$el.data('refresh-grid') !== false)) {
						$('body').trigger('refresh.grid', this);
					}

					resolve(data);
				})
				.catch((data) => {
					this.enableButtons();

					if ('errors' in data) {
						this.showErrors(data.errors);
					} else {
						theme.alertDanger(i18n.__('Error'));
					}

					reject(data);
				});
		});
	}

	triggerError(data) {
		this.$el.trigger('error.form', data);
	}

	showErrors(errors) {
		const theme = clientRegistry.getTheme();
		Object.keys(errors).forEach((itemKey) => {
			let $el = this.$(`[name=${this.prepareName(itemKey)}]`);
			if (!$el.length || !Array.isArray(errors[itemKey]))
				return;

			theme.setFormElErrors(this.$el, $el, $el.attr('name'), errors[itemKey]);
		});
	}

	prepareName(name) {
		name = name.replace('[', '\\[').replace(']', '\\]');

		return name;
	}

	clearErrors() {
		const theme = clientRegistry.getTheme();
		theme.clearFormErrors(this.$el);

		return this;
	}

	disableButtons() {
		this.$btns = this.$('button,input[type="submit"]').not(':disabled')
			.prop('disabled', true)
		;

		return this;
	}

	enableButtons() {
		if (this.$btns) {
			this.$btns.prop('disabled', false);
		}

		return this;
	}

	browserValidation() {
		//@ts-ignore
		if (!_.isFunction(this.el.reportValidity))
			return true;

		//@ts-ignore
		return this.el.reportValidity();
	}

	browserValidationEls($els) {
		let res = true;

		$els.each((i, el) => {
			if (!_.isFunction(el.reportValidity)) {
				return;
			}

			if (!el.reportValidity()) {
				res = false;
			}
		});

		return res;
	}
}