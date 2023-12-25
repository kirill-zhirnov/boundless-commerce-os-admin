pathAlias = require 'path-alias'
BasicAdmin = pathAlias '@basicAdmin'
_ = require 'underscore'
Q = require 'q'

class ImportYmlController extends BasicAdmin
	actionSetup : ->
		formKit = @createFormKit '@p-catalog/forms/import/setupYml', {
			importId : @getParam('importId')
		}, {
			success : (safeAttrs, pk, formKit) =>
				@metaRedirect @url('catalog/admin/import/waitingForImport', {
					importId: @getParam('importId')
					logId: formKit.form.getProductImportLog().log_id
				})

				@json {closeModal:true}
		}

		if @isSubmitted()
			formKit.process()
		else
			formKit.getWebForm()
			.then (data) =>
				_.extend data.buttons, {
					predefinedButtons :
						save :
							title : @getI18n().__('Continue')
							icon : 'glyphicon glyphicon-play'
					buttons : ['save']
				}

				@modal 'setup', data, @getI18n().__('Setup import'), null, {
					setBsConfig :
						backdrop : 'static'
				}
			.done()


module.exports = ImportYmlController