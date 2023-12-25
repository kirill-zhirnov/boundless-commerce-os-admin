import MyBackboneView from '../../../modules/backbone/my/view.client';
import {clientRegistry} from '../../../modules/registry/client/client.client';
import utils from '../../../modules/utils/common.client';
import gHtml from '../../../modules/gHtml/index.client';
import _ from 'underscore';
import $ from 'jquery';

const i18n = clientRegistry.getI18n();
const faIconPrefix = 'fa fa-';

const btnSmNowrap = 'btn btn-sm text-nowrap';
const btnSmPurple = `${btnSmNowrap} btn-purple`;

export default class BulkButtons extends MyBackboneView {
	constructor(options) {
		super(options);

		this.buttons = null;
		this.showCancel = true;
		this.showTitle = true;
		this.scope = null;

		_.extend(this, _.pick(options, ['buttons', 'scope', 'showCancel', 'showTitle']));
		this.listenTo$('body', 'emulateClick.bulkButton', (e, action) => {
			if (this.$el.is(':visible')) {
				this.$(`a.btn[data-action="${action}"]`).trigger('click');
			}
		});
	}

	// initialize(options) {
	// 	_.defaults(this, {
	// 		showCancel: true,
	// 		showTitle: true
	// 	});
	// }

	//@ts-ignore
	className() {
		return 'bulk-buttons';
	}

	events() {
		return {
			'click a[data-action]': (e) => {
				e.preventDefault();

				const $button = $(e.currentTarget);
				this.trigger('buttonClicked', $button.data('action'), $button);
			}
		};
	}

	show() {
		this.renderButtons();
		this.$el.show();
	}

	hide() {
		this.$el.hide();
	}

	render() {
		this.$el.html(this.getWrapperHtml());
		this.$el.appendTo('body');

		return this;
	}

	renderButtons() {
		const $buttons = this.$('.buttons');
		$buttons.empty();

		this.resolveButtons().map(
			(button, i) => $buttons.append(this.createButton(button))
		);
	}

	createButton(button) {
		if (Array.isArray(button)) {
			const $group = $('<div class="btn-group">');

			button.forEach(row => {
				return $group.append(utils.buildAButtonByProps(row));
			});

			return $group;
		} else {
			if (button.type) {
				if (button.type === 'raw') {
					return button.html;
				} else {
					button = _.defaults(button, this.getDefaultsByType(button));
				}
			}

			return utils.buildAButtonByProps(button);
		}
	}

	getDefaultsByType(button) {
		const btnTypes = this.getDefaultsTypes();

		if (button.type in btnTypes) {
			return btnTypes[button.type];
		} else {
			throw new Error(`Unknown button type '${button.type}'`);
		}
	}

	getDefaultsTypes() {
		return {
			rm: {
				label: i18n.__('Archive'),
				icon: `${faIconPrefix}trash`,
				class: btnSmPurple,
				attrs: {
					'data-action': 'rm'
				}
			},

			restore: {
				label: i18n.__('Restore'),
				icon: `${faIconPrefix}repeat`,
				class: btnSmPurple,
				attrs: {
					'data-action': 'restore'
				}
			},
			add: {
				label: i18n.__('Add'),
				icon: `${faIconPrefix}plus`,
				class: 'btn custom-btn custom-btn_purple-100 m-1',
				attrs: {
					'data-action': 'add'
				}
			}
		};
	}

	resolveButtons() {
		if ((this.buttons == null)) {
			return [];
		} else if (Array.isArray(this.buttons)) {
			return this.buttons;
		} else if (_.isObject(this.buttons)) {
			const scope = this.resolveScope();

			if (!(scope in this.buttons)) {
				throw new Error(`Scope '${scope}' is not in @buttons.`);
			}

			return this.buttons[scope];
		} else {
			throw new Error('Unsupported buttons type!');
		}
	}

	resolveScope() {
		if (_.isFunction(this.scope)) {
			return this.scope.call(this);
		} else {
			return this.scope;
		}
	}

	getWrapperHtml() {
		let cancel = '';
		if (this.showCancel) {
			cancel = gHtml.link(`${gHtml.faIcon('caret-down')} <span>${i18n.__('Cancel selection')}</span>`, '#', {
				class: `${btnSmNowrap} btn-outline-purple cancel`,
				'data-action': 'cancel'
			});
		}


		let title = '';
		if (this.showTitle) {
			title = gHtml.tag('b', {}, i18n.__('With selected:'));
		}

		return gHtml.tag('div', {class: 'general-content-wrapper'}, gHtml.tag('div', {class: 'general-content-subwrapper'}, `${cancel}${title}${gHtml.tag('div', {class: 'buttons'}, '')}`));
	}
}