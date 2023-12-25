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
const Q = require('q');

class ImportYmlController extends BasicAdmin {
	actionSetup() {
		const formKit = this.createFormKit('@p-catalog/forms/import/setupYml', {
			importId : this.getParam('importId')
		}, {
			success : (safeAttrs, pk, formKit) => {
				this.metaRedirect(this.url('catalog/admin/import/waitingForImport', {
					importId: this.getParam('importId'),
					logId: formKit.form.getProductImportLog().log_id
				})
				);

				return this.json({closeModal:true});
			}
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			return formKit.getWebForm()
			.then(data => {
				_.extend(data.buttons, {
					predefinedButtons : {
						save : {
							title : this.getI18n().__('Continue'),
							icon : 'glyphicon glyphicon-play'
						}
					},
					buttons : ['save']
				});

				return this.modal('setup', data, this.getI18n().__('Setup import'), null, {
					setBsConfig : {
						backdrop : 'static'
					}
				});
		})
			.done();
		}
	}
}


module.exports = ImportYmlController;