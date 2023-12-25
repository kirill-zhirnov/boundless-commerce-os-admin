import _ from 'underscore';
import $ from 'jquery';

export default class ClientTheme {
	constructor(config = {}) {
		this.config = Object.assign({
			themeUrl : '',
			ready : null
		}, config);

//		load styles on ready
		if (this.config.ready) {
			for (let key in this.config.ready) {
				const cssUrl = this.config.ready[key];
				$('head').prepend(`<link href="${cssUrl}" rel="stylesheet" id="b-css-${key}">`);
			}
		}
	}

//		$('html').addClass 'theme-inited'

	getThemeUrl() {
		return this.config.themeUrl;
	}

	clearFormErrors($form, formEls){
		this.triggerEvent('clearFormErrors.theme', function($form, formEls) {
			$form.find('.invalid-feedback').remove();
			return $form.find('.is-invalid').removeClass('is-invalid');
		}
		, [$form, formEls]);
	}


	setFormElErrors($form, $el, elName, elErrors) {
		this.triggerEvent('setFormElErrors.theme', function() {
			let formGroup = $el.parents('.form-group:eq(0)');
			if (formGroup.length === 0) {
				formGroup = $el.parents('.checkbox:eq(0)');

				if (formGroup.length === 0) {
					formGroup = $el.parents('.radio:eq(0)');
				}
			}
			$el.addClass('is-invalid');

			if (formGroup.length > 0) {
				formGroup.addClass('has-error');

				return Array.from(elErrors).map((error) =>
					formGroup.append('<div class="invalid-feedback">' + error + '</div>'));
			}
		}
		, [$form, $el, elName, elErrors]);
	}

	showAllFormErrors($form, errors, formEls) {
		return (() => {
			const result = [];
			for (let field in errors) {
				const fieldErrors = errors[field];
				if (formEls[field]) {
					const el = formEls[field].get(0);

					if (_.isFunction(el.focus)) {
						el.focus();
						break;
					} else {
						result.push(undefined);
					}
				} else {
					result.push(undefined);
				}
			}
			return result;
		})();
	}

	showAjaxLoading() {
		this.triggerEvent('showAjaxLoading.theme');
	}

	hideAjaxLoading() {
		this.triggerEvent('hideAjaxLoading.theme');
	}

	pageStartLoading() {
		this.triggerEvent('pageStartLoading.theme');
	}

	pageEndLoading() {
		this.triggerEvent('pageEndLoading.theme');
	}

	triggerEvent(name, defaultCallback, args = []) {
		const event = $.Event(name);
		$(document).trigger(event, args);

		if (!event.isDefaultPrevented() && _.isFunction(defaultCallback)) {
			return defaultCallback.apply(this, args);
		}
	}

	formChanged($form, isChanged) {}

	alert(alert, type) {
		return this.triggerEvent('alert.theme', null, [alert, type]);
	}

	alertDanger(alert) {
		return this.alert(alert, 'danger');
	}

	alertSuccess(alert) {
		return this.alert(alert, 'success');
	}
}