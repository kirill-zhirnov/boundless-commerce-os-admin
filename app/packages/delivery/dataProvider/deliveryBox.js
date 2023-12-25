// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');
const Q = require('q');

class BoxDataProvider extends DataProvider {
	getRules() {
		return [
			['title','safe']
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		const escapedLangId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.from('box');
		this.q.join('box_text', null, `box.box_id = box_text.box_id and box_text.lang_id = ${escapedLangId}`);
		this.compareRmStatus('box.deleted_at');

		const attrs = this.getSafeAttrs();
		return this.compare('box_text.title', attrs.title, true);
	}

	sortRules() {
		return {
			default: [{box : 'asc'}],
			attrs: {
				box : 'box_text.title'
			}
		};
	}
}

module.exports = BoxDataProvider;
