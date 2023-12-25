// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const BasicAdmin = pathAlias('@basicAdmin');

class FeatureController extends BasicAdmin {
	actionNotInTariff() {
		const feature = this.getParam('feature', 'unknown');

		const featureName = (() => { switch (feature) {
			case '1cSync': return this.getI18n().__('1c synchronization');
			default: return this.getI18n().__('unknown feature');
		} })();

		this.setPage('title', this.getI18n().__('Unavailable feature'));

		return this.render('notInTariff', {feature: featureName});
	}
}

module.exports = FeatureController;
