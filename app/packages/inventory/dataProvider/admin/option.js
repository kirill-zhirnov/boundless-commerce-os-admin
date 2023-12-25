// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');

class OptionDataProvider extends DataProvider {
	constructor(options) {
		if (options == null) { options = {}; }
		super(...arguments);

		this.category = options.category;

		if (!this.category) {
			throw new Error("You must set category!");
		}
	}

	getRules() {
		return [
			[
				'option_id,alias,title,sort',
				'safe'
			]
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		this.q.from('inventory_option', 'o');
		this.q.join('inventory_option_text', 'ot', 'ot.option_id = o.option_id');
		this.q.where('ot.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('o.category = ?', this.category);

		this.compareRmStatus('o.deleted_at');

		this.compare('o.option_id', this.getSafeAttr('option_id'));
		this.compare('o.alias', this.getSafeAttr('alias'), true);
		this.compare('ot.title', this.getSafeAttr('title'), true);
		return this.compareNumber('o.sort', this.getSafeAttr('sort'));
	}

	sortRules() {
		return {
			default: [{sort : 'asc'}],
			attrs: {
				option_id: 'o.option_id',
				title: 'ot.title',
				sort: 'o.sort'
			}
		};
	}
}

module.exports = OptionDataProvider;
