// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Widget = pathAlias('@widget');
const Q = require('q');
const _ = require('underscore');
const $ = require('jquery');
const ajax = pathAlias('@ajax');
const utils = pathAlias('@utils');
const gHtml = pathAlias('@modules/gHtml/index.@c');
const adminBasket = pathAlias('@p-orders/modules/adminBasket.@c');

class FormWidget extends Widget {
	constructor() {
		this.formEls = {};
		this.buttons = null;

		this.nameRegExp = /^([^\[]+)(\[.+)?$/i;
		this.suffixRegExp = /\[([^\[]*)\]/ig;
		this.intRegExp = /^[0-9]+$/;

		this.changed = false;
		this.tagName = 'form';

		this.formsGroupInited = false;

		super(...arguments);
	}

	attributes() {
		return {
//			autocomplete : 'off'
		};
	}

	onElReady() {
		super.onElReady(...arguments);

		this.setupForm();
		this.setupFormEls();
		return this.setupButtons();
	}

	events() {
		return {
			'input :input' : 'onChange',
			'submit' : 'onSubmit',
			'save.buttons .buttons' : 'onSubmit',
			'draft.buttons .buttons' : 'onSubmit',
			'onBeforeExit.form' : 'onBeforeExit'
		};
	}

	run() {
//		resolve started deferred
		return this.resolve();
	}

	onSubmit(e, additionalData) {
		if (additionalData == null) { additionalData = {}; }
		if (e != null) {
			e.preventDefault();
		}

		this.setupFormsGroup();

		const submitEvent = jQuery.Event('submit');
		this.trigger('submit', submitEvent, this);

		if (!submitEvent.isDefaultPrevented()) {
			return this.submit(additionalData)
			.then(function() {
				}).catch(function() {
				}).done();
		}
	}

	submit(additionalData) {
		if (additionalData == null) { additionalData = {}; }
		const deferred = Q.defer();

		const postData = this.serializeArray();
		for (let key in additionalData) {
			const val = additionalData[key];
			postData.push({
				name : key,
				value : val
			});
		}

		this.disableButtons();

		this.uploadFiles()
		.then(() => {
//			Из-за баги с changed, сразу устанавливаем в changed=false:
//			https://trello.com/c/jyDY2dmb/33-%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D0%B0-%D1%81-formchanged-%D0%B8%D0%B7-%D0%B7%D0%B0-%D1%80%D0%B0%D0%B7%D0%BD%D0%BE%D0%B3%D0%BE-%D1%83%D1%80%D0%BE%D0%B2%D0%BD%D1%8F-%D0%BB%D0%BE%D0%B3%D0%B8%D0%BA%D0%B8
			this.setChanged(false);

			const ajaxRes = ajax.post(this.getAction(), postData);

			this.$el.trigger('afterSubmit.form');

			return ajaxRes;
	}).then(data => {
			this.processSuccessResult(data);

			if (data.closeModal) {
				this.$el.trigger('close.modal');
			}

			return deferred.resolve(data);
		}).catch(data => {
			this.processErrorResult(data);
			return deferred.reject(data);
		}).done();

		return deferred.promise;
	}

	uploadFiles() {
		const deferred = Q.defer();

		const errors = {};
		const theme = this.getClientRegistry().getTheme();

		let f = Q();
		this.$('input[type="file"][data-upload]').each((e, input) => {
			const $input = $(input);

			return ($input => {
				return f = f.then(() => {
					theme.showAjaxLoading();

					const defInput = Q.defer();

					this.uploadFile($input)
					.then(res => {
						return defInput.resolve();
				}).catch(e => {
						_.extend(errors, e.errors);

						return defInput.resolve();
					}).done();

					return defInput.promise;
				});
			})($input);
		});

		f.then(() => {
			if (_.size(errors) > 0) {
				theme.hideAjaxLoading();

				return deferred.reject({
					errors
				});
			} else {
				return deferred.resolve();
			}
	}).done();

		return deferred.promise;
	}

	uploadFile($input) {
		if (!(FormData && FileList && File && $input.data('upload'))) {
			return Q.resolve();
		}

		const formData = new FormData();
		for (let file of Array.from($input.get(0).files)) {
			formData.append($input.attr('name'), file);
		}

		return ajax.post($input.data('upload'), formData, {
			processData : false,
			contentType : false,
			dataType : null,
			hidden : true
		});
	}

	serializeArray() {
		const arr = this.$el.serializeArray();

		const inpEls = {};
		this.$el.find('input[data-masked]').each((i, inpEl) => {
			const $el = $(inpEl);
			return inpEls[$el.attr('name')] = $el;
		});

		if (_.size(inpEls)) {
			for (let i = 0; i < arr.length; i++) {
				const item = arr[i];
				if (item.name in inpEls) {
					arr[i].value = inpEls[item.name].cleanVal();
				}
			}
		}

		return arr;
	}

	getAction() {
		return this.$el.attr('action');
	}

	processErrorResult(data) {
		this.enableButtons();
		this.clearErrors();

		const event = $.Event('error.form');
		this.$el.trigger(event, data);

		if (!event.isDefaultPrevented()) {
			if ('errors' in data) {
//				this method is needed to put focus(cursor) on first field or
//				to show all errors at once.
				this.showAllFormErrors(this.$el, data.errors);

				return this.showErrors(this.$el, data.errors);
			}
		}
	}

	processSuccessResult(data, refreshGrid) {
		if (refreshGrid == null) { refreshGrid = true; }
		this.enableButtons();
		this.clearErrors();
//		@reRenderButtons()

		if (data.pk) {
			this.setPk(data.pk);
		}

		this.$el.trigger('success.form', data);

		if (refreshGrid && (this.$el.data('refresh-grid') !== false)) {
			return $('body').trigger('refresh.grid', this);
		}
	}

	clearErrors() {
		return this.getClientRegistry().getTheme().clearFormErrors(this.$el, this.formEls);
	}

	showAllFormErrors($form, errors) {
		return this.getClientRegistry().getTheme().showAllFormErrors($form, errors, this.formEls);
	}

	showErrors($form, errors, els) {
		if (els == null) { els = this.formEls; }
		return (() => {
			const result = [];
			for (let elName in errors) {
				const elErrors = errors[elName];
				let $el = false;
				if (els && elName in els) {
					$el = els[elName];
				}

				if (_.isArray(elErrors)) {
					result.push(this.showError($form, $el, elName, elErrors));
				} else {
					result.push(this.showErrors($form, elErrors, $el));
				}
			}
			return result;
		})();
	}

	showError($form, $el, elName, elErrors) {
		if ($el !== false) {
			return this.getClientRegistry().getTheme().setFormElErrors($form, $el, elName, elErrors);
		}
	}

	setupForm() {
		if (this.$el.prop('tagName').toLowerCase() !== 'form') {
			throw new Error("Widget must be a form tag!");
		}
	}

//	Forms may be grouped in group. In this case a group will catch submit event and submit all forms in group
//	to grouped action.
	setupFormsGroup() {
		if (this.formsGroupInited) {
			return;
		}

		this.formsGroupInited = true;

		const $group = this.$el.parents('section[data-form-group]:eq(0)');
		if ($group.length > 0) {
			return utils.constructFormsGroupByEl($group);
		}
	}

	setupFormEls() {
		this.formEls = {};
		return this.$el.find('[name]:input').each((key, val) => {
			const $el = $(val);

			const nameArr = this.parseName($el.attr('name'));
			const lastKey = nameArr.length - 1;

			let obj = this.formEls;
			return (() => {
				const result = [];
				for (key = 0; key < nameArr.length; key++) {
					const objIndex = nameArr[key];
					if (key === lastKey) {
						result.push(obj[objIndex] = $el);
					} else {
						if (typeof obj[objIndex] === 'undefined') {
							obj[objIndex] = {};
						}

						result.push(obj = obj[objIndex]);
					}
				}
				return result;
			})();
	});
	}

	setupButtons() {
//		try to find buttons widget
		const widget = this.$('.buttons');
		if ((widget.length > 0) && widget.data('widget')) {
			this.buttons = widget.data('widget');
			return;
		}

		return this.buttons = this.$("button, input[type='button']");
	}

	getFormEls() {
		return this.formEls;
	}

	parseName(name) {
		const out = [];

		const result = name.match(this.nameRegExp);

		if (!result) {
			return out;
		}

		out.push(result[1]);

		if (result[2]) {
			let match = null;
			while ((match = this.suffixRegExp.exec(result[2]))) {
				out.push(match[1]);
			}

//			remove empty values or replace it with zero index:
			const lastIndex = out.length - 1;
			for (let key = 0; key < out.length; key++) {
				const val = out[key];
				if (typeof val === 'undefined') {
					break;
				}

				if (val === '') {
					if (this.areNextKeysFalse(out, key)) {
						out.splice(key, ((lastIndex - key) + 1));
					} else {
						out[key] = '0';
					}
				} else if (this.areNextKeysFalse(out, key)) {
					out.splice(key, ((lastIndex - key) + 1));
				}
			}
		}

		return out;
	}

	areNextKeysFalse(arr, startKey) {
		let out = true;
		for (let key = 0; key < arr.length; key++) {
			const val = arr[key];
			if (key >= startKey) {
				if ((val !== '') && (val.search(this.intRegExp) === -1)) {
					out = false;
					break;
				}
			}
		}

		return out;
	}

	onChange(e, data) {
		if (data == null) { data = {}; }
		if (data && data.skipChange) {
			return;
		}

		const $el = $(e.currentTarget);

		const skipSelector = '[data-skip-form-change]';
		if ($el.is(skipSelector) || ($el.parentsUntil('form', skipSelector).length > 0)) {
			return;
		}

		return this.setChanged(true);
	}

	isChanged() {
		return this.changed;
	}

	setChanged(val) {
		val = !!val;

		if (val !== this.changed) {
			this.getClientRegistry().getTheme().formChanged(this.$el, val);
		}

		this.changed = val;

		return this;
	}

	setPk(pk) {
		this.$el.find('.pk').remove();
		this.$el.prepend(gHtml.pk(pk));

		return this;
	}

	getPk() {
		return this.$('.pk').val();
	}

	focus() {
		const el = this.$el.find('input:text,select').get(0);

		if (el) {
			return el.focus();
		}
	}

	remove() {
		this.buttons = null;
		this.formEls = null;

		return super.remove(...arguments);
	}

	disableButtons() {
		if (this.buttons instanceof Widget) {
			return this.buttons.disableButtons();
		} else {
			return this.buttons.prop("disabled", true);
		}
	}

	enableButtons() {
		if (this.buttons instanceof Widget) {
			return this.buttons.enableButtons();
		} else {
			return this.buttons.prop("disabled", false);
		}
	}

	getName() {
		return this.$el.attr('name');
	}

	serializeObject() {
		return this.$el.serializeObject();
	}

	onBeforeExit(closeEvent) {
		const event = jQuery.Event('processBeforeExit');
		this.trigger('processBeforeExit', event, this, closeEvent);

		if (!event.isDefaultPrevented()) {
			if (this.isChanged() && !confirm(this.getI18n().__('Form has unsaved data. Are you really want to close it?'))) {
				return closeEvent.preventDefault();
			}
		}
	}
}

//	reRenderButtons : () ->
//		if @buttons instanceof Widget
//			@buttons.setIsNew false
//			@buttons.regenerate()

module.exports = FormWidget;