import BsModal from 'bootstrap/js/dist/modal';
import _ from 'underscore';
import MyBackboneView from '../backbone/my/view.client';
import FormWidget from '../widget/form.client';
import {clientRegistry} from '../registry/client/client.client';
import utils from '../utils/common.client';
import extend from 'extend';
import $ from 'jquery';

export default class Modal extends MyBackboneView {
	constructor(options = {}) {
		super(options);

		this.id = 'modal';
		this.dialogClasses = [];
		this.appendTo = 'body';

		this.title = null;
		this.content = null;
		this.html = null;

		this.bsConfig = {
			keyboard: false,
			backdrop: 'static'
		};

		this.isOpened = false;
		this.bsModal = null;

		Object.assign(this, _.pick(options, [
			'appendTo', 'title', 'content', 'bsConfig'
		]));
	}

	//@ts-ignore
	attributes() {
		return {
			'class': 'modal fade',
			tabindex: '-1',
			role: 'dialog',
			'aria-hidden': true,
			'aria-labelledby': 'modal-title'
		};
	}

	events() {
		return {
			'close.modal'(e) {
				return this.close();
			},

			'hidden.bs.modal'() {
				this.isOpened = false;

				return this.trigger('modal:afterClose', this);
			},

			'shown.bs.modal'() {
				this.isOpened = true;

				this.setupForms();

				this.$el.find('form').each(function (key, val) {
					const $form = $(val);
					const widget = $form.data('widget');

					if (widget instanceof FormWidget) {
						return widget.focus();
					}
				});
			},

			'hide.bs.modal'(e) {
				const event = $.Event('onBeforeExit.form');
				this.$el.find('form').trigger(event);

				if (event.isDefaultPrevented()) {
					e.preventDefault();
				}
			},

			'click [data-modal-close]'(e) {
				e.preventDefault();

				this.close();
			}
		};
	}

	async open() {
		this.trigger('modal:beforeOpen', this);

		await this.makeHtml();

		this.bsModal = new BsModal(this.$el.get(0), this.bsConfig);
		this.bsModal.show();

		this.trigger('modal:afterOpen', this);
	}

	setupForms() {
		this.$el.find('section[data-form-group]').each(function (key, val) {
			const $group = $(val);
			utils.constructFormsGroupByEl($group);
		});

		this.$el.find('form[data-form]').each(function (key, val) {
			const $form = $(val);
			utils.constructFormByEl($form);
		});
	}

	close() {
		if (this.bsModal) {
			this.bsModal.hide();
		}
	}

	setContent(content) {
		this.content = content;
		return this;
	}

	setTitle(title) {
		this.title = title;
		return this;
	}

	setHtml(html) {
		this.html = html;
		return this;
	}

	appendDialogClass(className) {
		if (!this.dialogClasses.includes(className)) {
			this.dialogClasses.push(className);
		}

		return this;
	}

	setSize(size) {
		switch (size) {
			case 'xl':
				size = 'modal-xl';
				break;
			case 'large':
				size = 'modal-lg';
				break;
			case 'small':
				size = 'modal-sm';
				break;
		}

		this.appendDialogClass(size);

		return this;
	}

	setBsConfig(config) {
		extend(true, this.bsConfig, config);

		return this;
	}

	getIsOpened() {
		return this.isOpened;
	}

	async makeHtml() {
		await this.prepareWrapper();

		if (this.dialogClasses.length > 0) {
			this.$('.modal-dialog').addClass(this.dialogClasses.join(' '));
		}

		if (this.title) {
			this.$('.modal-title').html(this.title);
		}

		if (this.content) {
			this.$('.modal-body').html(this.content);
		}

		const footerEl = this.$('.modal-footer');
		if (footerEl.is(':empty')) {
			footerEl.remove();
		}
	}

	async prepareWrapper() {
		if (this.$el.parent().length === 0) {
			this.$el.appendTo(this.appendTo);
		}

		let res;
		if (this.html) {
			res = this.html;
		} else {
			res = await clientRegistry.getView().localRender('file', '/blocks/modal');
		}

		this.$el.html(res);
	}
}