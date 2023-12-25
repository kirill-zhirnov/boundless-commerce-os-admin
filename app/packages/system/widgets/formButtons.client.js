import Widget from '../../../modules/widget/widget.client';
import _ from 'underscore';
import utils from '../../../modules/utils/common.client';
import extend from 'extend';
import gHtml from '../../../modules/gHtml/index.client';

export default class FormButtons extends Widget {
	constructor(options) {
		super(options);

		// this.closeModal = true;
		this.isNew = false;

		if (!_.isUndefined(options.isNew)) {
			this.isNew = !!options.isNew;
		}

//		@buttons = if @isNew then ['cancel', 'saveDraft', 'save'] else ['cancel', 'save']
		this.buttons = ['cancel', 'save'];
		_.extend(this, _.pick(options, ['buttons',
			// 'closeModal'
		]));

		this.predefinedButtons = extend(true, {
			cancel: {
				title: this.__('Cancel'),
				type: 'button',
				class: 'btn btn-outline-secondary',
				'data-modal-close': ''
			},

			// saveDraft: {
			// 	title: this.__('Save draft'),
			// 	type: 'button',
			// 	class: 'btn btn-outline-secondary save-draft'
			// },

			save: {
				title: this.isNew ? this.p__('formButtons', 'Create') : this.p__('formButtons', 'Update'),
				type: 'submit',
				class: 'btn btn-primary save',
				icon: 'fa fa-floppy-o'
			}
		}, options.predefinedButtons);

//		Parent widget - form or formsGroup
		this.parentWidgetInited = false;
	}

	attributes() {
		return {
			class: 'buttons'
		};
	}

	events() {
		return {
			// 'click .save-draft': 'onSaveDraftClicked',
			'click .save': (e) => {
				e.preventDefault();

				this.setupParentWidget();
				this.$el.trigger('save.buttons', this.getEventData());
			}
		};
	}

	getFileName() {
		return __filename;
	}

	run() {
		const renderedButtons = this.getButtonsForTpl().map((button) => this.createButton(button));

		return this.wrapInWrapper(
			gHtml.tag('div', {class: 'btn-group', role: 'group'}, renderedButtons.join('')),
			true
		);
	}

/*
	getTplData() {
		return {
			buttons: this.getButtonsForTpl(),
			// closeModal: this.closeModal,
			createButton: this.createButton
		};
	}*/

	createButton(button) {
		_.defaults(button, {
			suffix: '',
			tag: 'button'
		});

		const attrs = _.omit(button, ['title', 'suffix', 'tag']);

		let out = '';
		let icon = '';
		const {tag} = button;

		if (button.icon) {
			icon = gHtml.tag('i', {class: button.icon, 'aria-hidden': 'true'}, '') + ' ';
		}

		out += `<${tag} ${utils.buildHtmlAttrsStr(attrs)}>${icon}${button.title}${button.suffix}</${tag}>`;

		return out;
	}

	getButtonsForTpl() {
		const out = [];

		for (let button of Array.from(this.buttons)) {
			if (_.isObject(button)) {
				out.push(button);
			} else if (button in this.predefinedButtons) {
				out.push(this.predefinedButtons[button]);
			} else {
				throw new Error(`Button '${button}' not found in @predefinedButtons!`);
			}
		}

		return out;
	}

	// onSaveDraftClicked(e) {
	// 	e.preventDefault();
	//
	// 	this.setupParentWidget();
	// 	return this.$el.trigger('draft.buttons', this.getEventData({is_draft: 1}));
	// }

	getEventData(data = {}) {
		// if (this.showCloseModal) {
		// 	data.close_modal = this.$('input.close-modal').prop('checked') * 1;
		// }

		return data;
	}

	disableButtons() {
		this.$('button').attr('disabled', 'true');
	}

	enableButtons() {
		this.$('button').removeAttr('disabled');
	}

	setupParentWidget() {
		if (this.parentWidgetInited) {
			return;
		}

		this.parentWidgetInited = true;

		const $group = this.$el.parents('section[data-form-group]:eq(0)');
		if ($group.length > 0) {
			utils.constructFormsGroupByEl($group);
			return;
		}

		const $form = this.$el.parents('form[data-form]:eq(0)');
		if ($form.length > 0) {
			utils.constructFormByEl($form);
			return;
		}
	}

	getPropsForExport() {
		return super.getPropsForExport([
			'buttons', 'isNew', 'predefinedButtons',
			// 'closeModal'
		]);
	}
}
