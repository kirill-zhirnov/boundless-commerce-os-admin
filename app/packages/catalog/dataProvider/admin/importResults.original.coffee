pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class ImportResultsDataProvider extends DataProvider
	createQuery: ->
		@q.field('pl.log_id')
		@q.field('pl.import_id')
		@q.field('pl.file_name')
		@q.field('pl.status')
		@q.field("to_char(pl.started_at, 'DD.MM.YYYY, HH24:MI')", 'started_at')
		@q.field('pl.completed_at')
		@q.field('pl.result')
		@q.field('p.type')
		@q.field('p.run')
		@q.field('p.source_type')
		@q.from('product_import', 'p')
		@q.join('product_import_log', 'pl', 'p.import_id = pl.import_id')
		@q.where('p.lang_id = ?', @getEditingLang().lang_id)
		@q.where('p.site_id = ?', @getEditingSite().site_id)
		@q.where('pl.status in ?', ['success', 'error'])

	sortRules : ->
		return {
			default: [{started : 'desc'}]
			attrs:
				started : 'pl.started_at'
		}

module.exports = ImportResultsDataProvider
