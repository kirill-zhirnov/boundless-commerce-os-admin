Q = require 'q'
_ = require 'underscore'
pathAlias = require 'path-alias'
serverUtils = pathAlias 'app/modules/utils/server'
Applier = pathAlias "@modules/migrate/components/applier"
fs = require 'fs'
Sequelize = pathAlias '@modules/db/sequelize'
wrapperRegistry = pathAlias '@wrapperRegistry'
wrapperConfig = wrapperRegistry.getConfig()

class InstanceApplier extends Applier
	constructor: (@instanceRegistry, @tsFrom) ->
		super

		@migrationsForAppy = []

	applyMigrations : ->
		return serverUtils.runFlow @, [
			'setupInstanceDb'
			'detectMigrationsForApply',
			'execMigrations'
			'closeInstanceDb'
		]

	setupInstanceDb : ->
		@instanceDb = new Sequelize @instanceRegistry.getConfig().db.name, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config
		@turnOnLogging @instanceDb

	closeInstanceDb : ->
		return @instanceDb.close()

	detectMigrationsForApply : ->
		return @db.sql "
			select
				*
			from
				migration
			where
				ts > to_timestamp(:tsFrom, :format)
			order by
				version asc
		", {
			format: 'YYYY-MM-DD HH24:MI'
			tsFrom: @tsFrom
		}
		.then (rows) =>
			for row in rows
				if fs.existsSync pathAlias.resolve("migrations/#{row.version}.coffee")
					@migrationsForAppy.push row.version

			return

	execMigration : (migration) ->
		if !migration.shallApplyToInstances()
			return Q()

		console.log "Migration started", migration.getVersion()

		return Q(migration.up(@instanceDb, 'instance', @instanceRegistry))
		.then () =>
			console.log "Migration completed"
			return

	markMigrationAsCompleted : ->
		return Q()

module.exports = InstanceApplier