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
const utils = pathAlias('@utils');

class Sort extends Form {
	initialize() {
		super.initialize(...arguments);

		this.sortRules = [];
		return this.categorySettings = null;
	}

	getRules() {
		return [
			['limit, sub_category_policy', 'required'],
			['limit', 'isNum', {min: 1, max: 40}],
			['mode', 'safe'],
			['sub_category_policy', 'inOptions', {'options': 'subCategoryPolicy'}],
			['products_aos', 'inOptions', {options: 'aos'}]
		];
	}

	setup() {
		return super.setup(...arguments)
		.then(() => {
			return this.getInstanceRegistry().getSettings().get('catalog', 'category');
	}).then(value => {
			this.categorySettings = value;
			this.sortRules = _.isArray(value.sort) ? value.sort : [];

			this.attributes.limit = value.limit;
			this.attributes.sub_category_policy = value.sub_category_policy;
			this.attributes.products_aos = value.productsAos;

		});
	}

	getTplData() {
		return super.getTplData(...arguments)
		.then(data => {
			data.sortRules = this.sortRules;

			return data;
		});
	}

	save() {
		const attrs = this.getSafeAttrs();

		for (let i = 0; i < this.sortRules.length; i++) {
			const rule = this.sortRules[i];
			if (attrs.mode[rule.type] && (_.indexOf(['asc', 'desc'], attrs.mode[rule.type]) !== -1)) {
				this.sortRules[i].mode = attrs.mode[rule.type];
			}
		}

		return this.getInstanceRegistry().getSettings().set('catalog', 'category', {
			sort: this.sortRules,
			limit: parseInt(attrs.limit),
			sub_category_policy: attrs.sub_category_policy,
			productsAos: attrs.products_aos ? attrs.products_aos : null
		});
	}

	rawOptions() {
		const ruleTypeOptions = ruleType(this.getI18n());

		const aos = this.getAosOptions();
		aos.unshift(['', this.__('Without animation')]);

		const out = {
			type: ruleTypeOptions,
			subCategoryPolicy: [
				['subGoods', this.__('Show goods from sub-categories')],
				['subCategories', this.__('Show sub-categories list')],
				['subCategoriesNoLeftMenu', this.__('Show sub-categories list without left menu')],
			],
			aos
		};

		for (let row of Array.from(ruleTypeOptions)) {
			out[`mode_${row[0]}`] = this.getModeOptionsByType(row[0]);
		}

		return out;
	}

	getModeOptionsByType(type) {
		switch (type) {
			case "availability":
				return [
					["asc", this.getI18n().__("First in-stock")],
					["desc", this.getI18n().__("First out-of-stock")]
				];

			case "price":
				return [
					["asc", this.getI18n().__("Cheap first")],
					["desc", this.getI18n().__("Expensive first")]
				];

			case "name":
				return [
					["asc", this.getI18n().__("A -> Z")],
					["desc", this.getI18n().__("Z -> A")]
				];

			case "created_at":
				return [
					["asc", this.__("Newest last")],
					["desc", this.__("Newest first")]
				];

			default:
				throw new Error(`Mode options for type '${type}' not defined!`);
		}
	}

	removeRule(type) {
		const [i, rule] = Array.from(this.getRuleByType(type));
		if (!_.isUndefined(i)) {
			this.sortRules.splice(i, 1);
		}

		return this.saveSortRules();
	}

	saveSort(sort) {
		const newOrder = [];
		for (let type of Array.from(sort)) {
			const [i, rule] = Array.from(this.getRuleByType(type));

			if (!_.isUndefined(i)) {
				newOrder.push(rule);
			}
		}

		this.sortRules = newOrder;

		return this.saveSortRules();
	}

	getRuleByType(type) {
		for (let i = 0; i < this.sortRules.length; i++) {
			const rule = this.sortRules[i];
			if (rule.type === type) {
				return [i, rule];
			}
		}
	}

	saveSortRules() {
		this.categorySettings.sort = this.sortRules;

		return this.getRegistry().getSettings().set('catalog', 'category', this.categorySettings);
	}
}

module.exports = Sort;