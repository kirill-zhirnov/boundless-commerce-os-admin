// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const GridResource = pathAlias('@grid-resource');

class BasicController extends GridResource {
	init() {
		super.init(...arguments);

		return this.grid = {
			widget: '',
			provider: '@p-inventory/dataProvider/admin/option',
			providerOptions : {
				category : this.category
			},
			model: 'inventoryOption',
			form: {
				path : '@p-inventory/forms/option',
				tpl : '/admin/option/basic/form',
				formOptions : {
					category : this.category
				}
			}
		};
	}
}


module.exports = BasicController;