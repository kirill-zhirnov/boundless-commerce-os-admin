// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const BasicAdmin = pathAlias('@basicAdmin');
const _ = require('underscore');

class CompanyController extends BasicAdmin {
	actionRequisites() {
		const formKit = this.createFormKit('@p-system/forms/companySettings');

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			return formKit.getWebForm()
			.then(data => {
				this.setPage('title', this.getI18n().__('Store requisites'));

				_.extend(data.buttons, {
					buttons : ['save'],
					predefinedButtons : {
						save : {
							title : this.getI18n().__('Save')
						}
					}
				});

				return this.render('settings', {data: data.attrs, buttons: data.buttons});
		})
			.done();
		}
	}
}


module.exports = CompanyController;
