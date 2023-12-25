import Widget from './widget.client';
import utils from '../utils/common.client';
import FormButtons from '../../packages/system/widgets/formButtons.client';
import ajax from '../ajax/kit.client';
import _ from 'underscore';
import $ from 'jquery';

const tabHasError = 'tab-has-errors';

// This class needs to manage forms group.
export default class FormsGroup extends Widget {
	constructor(options) {
		super(options);

		this.forms = [];
		this.buttons = null;
		this.closeConfirmationAsked = {};
	}

	events() {
		return {
			'save.buttons .buttons': 'onButtonClick',
			'draft.buttons .buttons': 'onButtonClick',
			'contentLoaded.tab button[data-bs-toggle="tab"]': (e) => {
				const $button = $(e.target);
				const $content = $button.parents('.nav-tabs').next('.tab-content').find(`${$button.data('bs-target')}`);

				this.setupForms($content);
			}
		};
	}

	onElReady() {
		super.onElReady();

		this.setupForms();
		this.setupButtons();
	}

//	submit all forms
	submit(data = {}) {
		const postData = Object.assign({
			_common: data
		}, this.serializeForms());

		this.disableButtons();

		if (!this.$el.data('form-group')) {
			throw new Error('You must specify action for form-group');
		}

//		Same bug as in form widget:
//		https://trello.com/c/jyDY2dmb/33-%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D0%B0-%D1%81-formchanged-%D0%B8%D0%B7-%D0%B7%D0%B0-%D1%80%D0%B0%D0%B7%D0%BD%D0%BE%D0%B3%D0%BE-%D1%83%D1%80%D0%BE%D0%B2%D0%BD%D1%8F-%D0%BB%D0%BE%D0%B3%D0%B8%D0%BA%D0%B8
		for (const item of this.forms) {
			item.form.setChanged(false);
		}

		return ajax.post(this.$el.data('form-group'), postData)
			.then(result => {
				return this.processSuccess(result);
			})
			.catch(result => {
				if ('forms' in result) {
					this.enableButtons();
					this.clearErrors();
					this.markTabsAsErrors(result.forms);

					for (const item of this.forms) {
						const {name} = item;
						const {form} = item;

						if (name in result.forms) {
							form.processErrorResult(result.forms[name]);
						} else {
							form.clearErrors();
						}
					}
				}
			});
	}

	processSuccess(result) {
		this.enableButtons();
		this.clearErrors();
		const pk = this.getFirstPk(result.forms);

		if (pk) {
			this.enableTabs(pk);
		}
//			@reRenderButtons pk

		for (let item of Array.from(this.forms)) {
			const {
				name
			} = item;
			const {
				form
			} = item;

			if (!(name in result.forms)) {
				continue;
			}

			form.processSuccessResult(result.forms[name], false);
		}

		if (result._common && result._common.closeModal) {
			this.$el.trigger('close.modal');
		}

		$('body').trigger('refresh.grid', this);

	}

	markTabsAsErrors(formErrors) {
		if (this.$('.nav-tabs').length === 0) {
			return;
		}

		for (let item of this.forms) {
			const formName = item.name;
			const {form} = item;

			if (!(formName in formErrors)) {
				continue;
			}

			const $tabPane = form.$el.parents('.tab-pane:eq(0)');

			if ($.contains(this.$el.get(0), $tabPane.get(0))) {
				this.$('.nav-tabs .nav-item button[data-bs-target="#' + $tabPane.attr('id') + '"]')
					.parents('li:eq(0)')
					.addClass(tabHasError)
				;
			}
		}
	}

	clearErrors() {
		return this.$('.nav-tabs > li').removeClass(tabHasError);
	}

	serializeForms() {
		const out = {};
		for (let item of Array.from(this.forms)) {
			const formName = item.name;
			const val = item.form.serializeObject();

			if (_.isEmpty(val)) {
				continue;
			}

			if (!(formName in out)) {
				out[formName] = {};
			}

			_.extend(out[formName], val);
		}

		return out;
	}

	setupForms($parent = null) {
		let $els;
		if (!$parent) {
			$els = this.$('form');
		} else {
			$els = $parent.find('form');
		}

		return $els.each((key, val) => {
			const $form = $(val);

			if (!_.isUndefined($form.data('form')) || $form.data('widget')) {
				this.addForm($form);
			}

			return true;
		});
	}

	addForm($form) {
		const formWidgetInstance = utils.constructFormByEl($form);
		if (!formWidgetInstance.getName()) {
			throw new Error('Form in group must have a name!');
		}

		this.listenTo(formWidgetInstance, 'submit', this.onFormSubmit);
		this.listenTo(formWidgetInstance, 'processBeforeExit', this.onProcessBeforeExit);

		const formName = formWidgetInstance.getName();
		return this.forms.push({
			name: formName,
			form: formWidgetInstance
		});
	}

	setupButtons() {
		return this.$('.buttons').each((key, val) => {
			const $el = $(val);

			if (!this.buttons && $el.data('widget') instanceof FormButtons) {
				return this.buttons = $el.data('widget');
			}
		});
	}

	disableButtons() {
		if (this.buttons) {
			return this.buttons.disableButtons();
		}
	}

	enableButtons() {
		if (this.buttons) {
			return this.buttons.enableButtons();
		}
	}

	enableTabs(pk) {
		this.$('ul.nav-tabs > button.disabled[data-enable-if-pk]').each(function (key, el) {
			const $el = $(el);
			$el.removeClass('disabled');

			const $tab = $el.parents('.nav-item');
			if (!_.isUndefined($tab.data('tab-url'))) {
				let url = $tab.data('tab-url');
				url = url.replace('{pk}', pk);

				$tab.data('tab-url', url);
			}
		});
	}

	getFirstPk(forms) {
		let pk = null;

		for (let formName in forms) {
			const data = forms[formName];
			if ('pk' in data) {
				({
					pk
				} = data);
				break;
			}
		}

		return pk;
	}

	remove() {
		this.forms = [];
		this.buttons = null;

		return super.remove();
	}

	onButtonClick(e, data = {}) {
		this.submit(data);
	}

	onProcessBeforeExit(e, formWidget, closeEvent) {
		e.preventDefault();

		if (formWidget.isChanged() && !this.closeConfirmationAsked[closeEvent.timeStamp]) {
			this.closeConfirmationAsked[closeEvent.timeStamp] = true;

			if (!confirm(this.getI18n().__('Form has unsaved data. Are you really want to close it?'))) {
				return closeEvent.preventDefault();
			}
		}
	}

	onFormSubmit(e) {
		e.preventDefault();

		let data = {};
		if (this.buttons) {
			data = this.buttons.getEventData();
		}

		return this.submit(data);
	}

	isChanged() {
		for (let item of Array.from(this.forms)) {
			if (item.form.isChanged()) {
				return true;
			}
		}

		return false;
	}
}

//	reRenderButtons : (pk) ->
//		if @buttons
//			@buttons.setIsNew false
//			@buttons.regenerate()