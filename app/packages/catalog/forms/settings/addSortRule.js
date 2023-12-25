// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');
const ruleType = require('./sort/ruleType');

class addSortRule extends Form {
	initialize() {
		this.rules = null;
		this.modalRedirect = null;
		return this.categorySettings = null;
	}

	getRules() {
		return [
			['new_rule_type', 'required'],
			['new_rule_type', 'inOptions', {options: 'type'}],
			['new_rule_type', 'validateOnUniqueRule']
		];
	}

	save() {
		return Q()
		.then(() => {
			return this.getRuleByType(this.getSafeAttr('new_rule_type'));
	}).then(rule => {
			this.rules.push(rule);

			this.categorySettings.sort = this.rules;
			return this.getRegistry().getSettings().set('catalog', 'category', this.categorySettings);
		});
	}

	validateOnUniqueRule(value, options, field) {
		if (!this.hasErrors(field) && (_.indexOf(['availability', 'price', 'name', 'created_at'], value) !== -1)) {
			for (let rule of Array.from(this.rules)) {
				if (rule.type === value) {
					this.addError(field, 'notUnique', this.getI18n().__('Sorting rule by selected parameter already exists!'));
				}
			}
		}

		return true;
	}

	setup() {
		return super.setup(...arguments)
		.then(() => {
			return this.getRegistry().getSettings().get('catalog', 'category');
	}).then(result => {
			this.categorySettings = result;
			this.rules = _.isArray(result.sort) ? result.sort : [];

		});
	}

	getModalRedirect() {
		return this.modalRedirect;
	}

	getRuleByType(type) {
		const out = {
			type,
			mode : 'asc',
			props : {}
		};

		return out;
	}

	rawOptions() {
		return {
			type: ruleType(this.getI18n())
		};
	}
}

module.exports = addSortRule;
