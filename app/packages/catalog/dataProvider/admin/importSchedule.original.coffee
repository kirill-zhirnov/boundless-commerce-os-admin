pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
wrapperRegistry = pathAlias '@wrapperRegistry'
Q = require 'q'

class ImportScheduleDataProvider extends DataProvider
	createQuery: ->
		@q.from('product_import', 'p')
		@q.join("(
			select
				import_id,
				count(status) as qty
			from
				product_import_log
			where
				status in ('ready_for_import', 'success')
			group by import_id
		) import_log using(import_id)")
		@q.where('p.lang_id = ?', @getEditingLang().lang_id)
		@q.where('p.site_id = ?', @getEditingSite().site_id)
		@q.where("p.run = 'cron'")
		@q.where("import_log.qty > 0")
		@compareRmStatus 'p.deleted_at'

	sortRules : ->
		return {
			default: [{created : 'asc'}]
			attrs:
				created : 'p.created_at'
		}

	prepareData : (rows) ->
		if rows.length == 0
			return [@getMetaResult(), rows]

		deferred = Q.defer()

		Q wrapperRegistry.getDb().model('task').findAll {
			where:
				instance_id: @getInstanceRegistry().getInstanceInfo().instance_id
		}
		.then (tasks) =>
			for task in tasks
				for row in rows
					if task.local_id == row.import_id
						row.schedule = task.cron_rule

			deferred.resolve [@getMetaResult(), rows]
		.done()

		return deferred.promise

module.exports = ImportScheduleDataProvider
