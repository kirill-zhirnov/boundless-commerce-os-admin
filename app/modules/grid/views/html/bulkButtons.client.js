import _ from 'underscore';
import {clientRegistry} from '../../../registry/client/client.client';
import $ from 'jquery';
import utils from '../../../utils/common.client';
import MyBackboneView from '../../../backbone/my/view.client';

export default class BulkButtons extends MyBackboneView {
	constructor(options = {}) {
		super(options);

		_.extend(this, _.pick(options, ['buttons', 'gridHtmlView', 'role', 'scope']));

		if (!this.role) {
			throw new Error('You must pass role!');
		}

		this.attributes || (this.attributes = {});
		this.attributes['data-role'] = this.role;

		this._ensureElement();
	}

	events() {
		return {
			'click a[data-action]' : 'onButtonClick'
		};
	}

	render() {
		this.$el.empty();

		for (let button of this.resolveButtons()) {
			if (button.type) {
				button = _.defaults(button, this.getDefaultsByType(button));
			}

			this.$el.append(utils.buildAButtonByProps(button));
		}
	}

	resolveButtons() {
		if (Array.isArray(this.buttons)) {
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

	getDefaultsByType(button) {
		const btnClasses = 'btn btn-default';
		const iconPrefix = 'glyphicon glyphicon-';
		const i18n = clientRegistry.getI18n();

		switch (button.type) {
			case 'rm':
				return {
					label : i18n.__('Archive'),
					icon : `${iconPrefix}trash`,
					class : btnClasses,
					attrs : {
						'data-action' : 'rm'
					}
				};
			case 'restore':
				return {
					label : i18n.__('Restore'),
					icon : `${iconPrefix}repeat`,
					class : btnClasses,
					attrs : {
						'data-action' : 'restore'
					}
				};
			case 'add':
				return {
					label : i18n.__('Add'),
					icon : `${iconPrefix}plus`,
					class : btnClasses,
					attrs : {
						'data-modal': '',
						href : this.gridHtmlView.gridWidget.getFormUrl()
					}

				};
			default:
				throw new Error(`Unknown button type '${button.type}'`);
		}
	}


	onButtonClick(e) {
		e.preventDefault();

		const $button = $(e.currentTarget);
		return this.trigger('buttonClicked', $button);
	}

	remove() {
		this.gridHtmlView = null;
		this.scope = null;

		return super.remove();
	}

	_ensureElement() {
		if (!this.el && this.gridHtmlView) {
			const $el = this.gridHtmlView.$(`${this.tagName}[data-role="${this.role}"]`);

			if ($el.length > 0) {
				this.el = $el.get(0);
			} else {
				throw new Error(`Cant find el for buttons: '${this.role}'`);
			}
		}

		return super._ensureElement();
	}
}