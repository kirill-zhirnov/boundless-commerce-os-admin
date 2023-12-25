import Widget from './widget.client';
import _ from 'underscore';
import $ from 'jquery';
import ajax from '../ajax/kit.client';
import utils from '../utils/common.client';
import gHtml from '../gHtml/index.client';
import FormButtons from '../../packages/system/widgets/formButtons.client';

export default class FormWidget extends Widget {
	protected changed: boolean = false;
	protected formsGroupInited: boolean = false;
	//eslint-disable-next-line
	protected nameRegExp: RegExp = /^([^\[]+)(\[.+)?$/i;
	//eslint-disable-next-line
	protected suffixRegExp: RegExp = /\[([^\[]*)\]/ig;
	protected intRegExp: RegExp = /^[0-9]+$/;
	protected buttons: FormButtons | JQuery<HTMLElement>;
	protected formEls: {[key: string]: any};

	constructor(options) {
		super(options);

		// this.formEls = {};

		this.tagName = 'form';
	}

	attributes() {
		return {};
	}

	onElReady() {
		super.onElReady();

		this.setupForm();
		this.setupFormEls();
		this.setupButtons();
	}

	events() {
		return {
			'input :input': 'onChange',
			'submit': 'onSubmit',
			'save.buttons .buttons': 'onSubmit',
			'draft.buttons .buttons': 'onSubmit',
			'onBeforeExit.form': 'onBeforeExit'
		};
	}

	async run() {
		return '';
	}

	async onSubmit(e, additionalData = {}) {
		if (e) {
			e.preventDefault();
		}

		this.setupFormsGroup();

		const submitEvent = jQuery.Event('submit');
		this.trigger('submit', submitEvent, this);

		if (!submitEvent.isDefaultPrevented()) {
			await this.submit(additionalData);
		}
	}

	async submit(additionalData = {}) {
		const postData = this.serializeArray();
		for (const key in additionalData) {
			const val = additionalData[key];
			postData.push({
				name: key,
				value: val
			});
		}

		try {
			this.disableButtons();
			await this.uploadFiles();

//			Из-за баги с changed, сразу устанавливаем в changed=false:
//			https://trello.com/c/jyDY2dmb/33-%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D0%B0-%D1%81-formchanged-%D0%B8%D0%B7-%D0%B7%D0%B0-%D1%80%D0%B0%D0%B7%D0%BD%D0%BE%D0%B3%D0%BE-%D1%83%D1%80%D0%BE%D0%B2%D0%BD%D1%8F-%D0%BB%D0%BE%D0%B3%D0%B8%D0%BA%D0%B8
			this.setChanged(false);

			const ajaxRes = ajax.post(this.getAction(), postData);
			this.$el.trigger('afterSubmit.form');
			const data = await ajaxRes;

			this.processSuccessResult(data);

			if (data.closeModal) {
				this.$el.trigger('close.modal');
			}

			return data;
		} catch (e) {
			this.processErrorResult(e);
		}
	}

	async uploadFiles() {
		const errors = {};
		const theme = this.getClientRegistry().getTheme();

		const $inputs = this.$('input[type="file"][data-upload]');
		for (const input of $inputs) {
			const $input = $(input);
			try {
				await this.uploadFile($input);
			} catch (e) {
				Object.assign(errors, e.errors);
			}
		}

		if (Object.keys(errors).length > 0) {
			theme.hideAjaxLoading();

			return Promise.reject({errors});
		}
	}

	async uploadFile($input) {
		if (!(FormData && FileList && File && $input.data('upload')))
			return;

		const formData = new FormData();
		for (const file of $input.get(0).files) {
			formData.append($input.attr('name'), file);
		}

		return ajax.post(
			$input.data('upload'),
			formData,
			{
				processData: false,
				contentType: false,
				dataType: null,
				hidden: true
			}
		);
	}

	setupForm() {
		if (this.$el.prop('tagName').toLowerCase() !== 'form') {
			throw new Error('Widget must be a form tag!');
		}
	}

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

	serializeArray() {
		const arr = this.$el.serializeArray();

		const inpEls = {};
		this.$el.find('input[data-masked]').each((i, inpEl) => {
			const $el = $(inpEl);
			inpEls[$el.attr('name')] = $el;
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

	disableButtons() {
		if (this.buttons instanceof Widget) {
			return this.buttons.disableButtons();
		} else {
			return this.buttons.prop('disabled', true);
		}
	}

	enableButtons() {
		if (this.buttons instanceof Widget) {
			return this.buttons.enableButtons();
		} else {
			return this.buttons.prop('disabled', false);
		}
	}

	setChanged(val: boolean) {
		val = !!val;

		if (val !== this.changed) {
			this.getClientRegistry().getTheme().formChanged(this.$el, val);
		}

		this.changed = val;

		return this;
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
				this.showErrors(this.$el, data.errors);
			}
		}
	}

	processSuccessResult(data, refreshGrid = true) {
		this.enableButtons();
		this.clearErrors();
//		@reRenderButtons()

		if (data.pk) {
			this.setPk(data.pk);
		}

		this.$el.trigger('success.form', data);

		if (refreshGrid && (this.$el.data('refresh-grid') !== false)) {
			$('body').trigger('refresh.grid', this);
		}
	}

	clearErrors() {
		return this.getClientRegistry().getTheme().clearFormErrors(this.$el, this.formEls);
	}

	showAllFormErrors($form, errors) {
		return this.getClientRegistry().getTheme().showAllFormErrors($form, errors, this.formEls);
	}

	showErrors($form, errors, els = null) {
		if (els == null) {
			els = this.formEls;
		}

		for (const [elName, elErrors] of Object.entries(errors)) {
			let $el: false|JQuery = false;
			if (els && elName in els) {
				$el = els[elName];
			}

			if (Array.isArray(elErrors)) {
				this.showError($form, $el, elName, elErrors);
			} else {
				this.showErrors($form, elErrors, $el);
			}
		}
	}

	showError($form, $el, elName, elErrors) {
		if ($el !== false) {
			return this.getClientRegistry().getTheme().setFormElErrors($form, $el, elName, elErrors);
		}
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

	getName() {
		return this.$el.attr('name');
	}

	serializeObject() {
		//@ts-ignore
		return this.$el.serializeObject();
	}

	onBeforeExit(closeEvent) {
		const event = jQuery.Event('processBeforeExit');
		this.trigger('processBeforeExit', event, this, closeEvent);

		if (!event.isDefaultPrevented()) {
			if (this.isChanged() && !confirm(this.__('Form has unsaved data. Are you really want to close it?'))) {
				return closeEvent.preventDefault();
			}
		}
	}

	isChanged(): boolean {
		return this.changed;
	}

	setupButtons() {
//		try to find buttons widget
		const widget = this.$('.buttons');
		if ((widget.length > 0) && widget.data('widget')) {
			this.buttons = widget.data('widget');
			return;
		}

		return this.buttons = this.$('button, input[type=\'button\']');
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

	onChange(e, data: {[key: string]: any} = {}) {
		if (data && data.skipChange) {
			return;
		}

		const $el = $(e.currentTarget);

		const skipSelector = '[data-skip-form-change]';
		if ($el.is(skipSelector) || ($el.parentsUntil('form', skipSelector).length > 0)) {
			return;
		}

		this.setChanged(true);
	}

	setupFormEls() {
		this.formEls = {};
		this.$el.find('[name]:input').each((key, val) => {
			const $el = $(val);

			const nameArr = this.parseName($el.attr('name'));
			const lastKey = nameArr.length - 1;

			let obj = this.formEls;
			for (const [key, objIndex] of Object.entries(nameArr)) {
				if (parseInt(key) === lastKey) {
					obj[objIndex] = $el;
				} else {
					if (typeof obj[objIndex] === 'undefined') {
						obj[objIndex] = {};
					}

					obj = obj[objIndex];
				}
			}
		});
	}

	remove() {
		this.buttons = null;
		this.formEls = null;

		return super.remove();
	}
}