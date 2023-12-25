// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const BasicOptionResource = pathAlias('@p-inventory/controllers/admin/option/basic');

class ChangeQty extends BasicOptionResource {
	init() {
		this.category = 'changeQty';

		super.init(...arguments);

		return this.grid.widget = 'inventory.optionChangeQtyGrid.@c';
	}

	actionIndex() {
		this.setPage({
			title: this.getI18n().__('Change qty reasons list')
		});

		return super.actionIndex(...arguments);
	}
}

module.exports = ChangeQty;