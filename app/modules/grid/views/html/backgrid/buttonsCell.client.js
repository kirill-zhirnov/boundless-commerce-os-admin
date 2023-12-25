// @ts-nocheck
import Backgrid from 'backgrid';
import _ from 'underscore';
import {clientRegistry} from '../../../../registry/client/client.client';
import utils from '../../../../utils/common.client';
import $ from 'jquery';

export default class ButtonsCell extends Backgrid.Cell {
	constructor(options) {
		super(options);

		this.className = 'buttons-cell';
		this.buttons = this.column.get('buttons') || [];
		this.scope = this.column.get('scope') || null;
	}

	events() {
		return {
			'click a,button': 'onButtonClick'
		};
	}


	render() {
		this.$el.empty();

		for (let button of Array.from(this.resolveButtons())) {
			if (_.isString(button)) {
				this.$el.append(button);
			} else if (_.isFunction(button)) {
				this.$el.append(button.call(this, this.model));
			} else if (_.isObject(button)) {
				if (button.type) {
					button = _.defaults(button, this.getDefaultsByType(button));
				}

				this.$el.append(utils.buildAButtonByProps(button));
			} else {
				throw new Error('Unknown buttons format. Expected string or object.');
			}
		}

		this.delegateEvents();
		return this;
	}

	resolveButtons() {
		if (_.isFunction(this.buttons)) {
			return this.buttons.call(this, this.model);
		} else if (_.isArray(this.buttons)) {
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
			return this.scope.call(this, this.model);
		} else {
			return this.scope;
		}
	}

	getDefaultsByType(button) {
		const i18n = clientRegistry.getI18n();
		const buttonClasses = 'btn custom-btn custom-btn_outlined custom-btn_xs m-2';

		switch (button.type) {
			case 'edit':
				return {
					label: i18n.__('Edit'),
					icon: 'fa fa-pencil',
					class: buttonClasses,
					attrs: {
						'data-action': 'edit'
					}
				};
			case 'restore':
				return {
					label: i18n.__('Restore'),
					icon: 'fa fa-repeat',
					class: buttonClasses,
					attrs: {
						'data-action': 'restore'
					}
				};
			case 'rm':
				return {
					label: i18n.__('Archive'),
					icon: 'fa fa-trash',
					class: buttonClasses,
					attrs: {
						'data-action': 'rm'
					}
				};
			default:
				throw new Error(`Unknown button type '${button.type}'`);
		}
	}

	onButtonClick(e) {
		const $btn = $(e.currentTarget);

		if ($btn.data('action')) {
			e.preventDefault();
			return this.model.trigger('backgrid:buttonClicked', this.model, $btn);
		}
	}
}

Backgrid.ButtonsCell = ButtonsCell;