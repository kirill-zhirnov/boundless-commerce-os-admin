Q = require 'q'
pathAlias = require 'path-alias'
wrapperRegistry = pathAlias '@wrapperRegistry'
wrapperConfig = wrapperRegistry.getConfig()
InstanceBootstrapper = pathAlias '@modules/bootstrap/instance'
instances = pathAlias '@modules/instances'
Sequelize = pathAlias '@modules/db/sequelize'

views =
	regions : [
		'vw_city'
		'vw_country'
		'vw_region'
	]
	shipping : [
		'vw_delivery_city'
		'vw_delivery_country'
		'vw_shipping'
		'vw_shipping_city'
		'vw_shipping_zip'
	]

module.exports.refresh = (scopes) ->
	dbList = [@getSampleDb()]
	return @getInstancesDb()
	.then (res) =>
		dbList = dbList.concat res

		f = Q()
		for scope in scopes
			for db in dbList
				do (scope, db) =>
					f = f.then () =>
						return @refreshForDb db, views[scope]

		return f
	.then () =>
		f = Q()
		for db in dbList
			do (db) =>
				f = f.then () =>
					return db.close()
		return f
	.then () =>
		return

module.exports.refreshForDb = (db, views) ->
	f = Q()
	for view in views
		do (view) ->
			f = f.then () =>
				deferred = Q.defer()

				db.sql "refresh materialized view #{view}"
				.then () =>
					deferred.resolve()
				.catch (e) ->
					console.error "Error refreshing view: '#{view}'", db.config

					deferred.reject(e)
				.done()

				return deferred.promise

	return f

module.exports.getSampleDb = () ->
	return new Sequelize(
		wrapperConfig.instanceManager.db.sample,
		wrapperConfig.db.user,
		wrapperConfig.db.pass,
		wrapperConfig.db.config
	)

module.exports.getInstancesDb = () ->
	out = []
	return instances.loadAndPutInCache()
	.then (data) =>
		f = Q()

		for key, instance of data.instances
			do (instance) =>
				f = f.then () =>
					#  connect with wrapper user and pass, since wrapper is owner of all tables in postgres
					bootstrapper = new InstanceBootstrapper(instance)
					return bootstrapper.runDb()
					.then () =>
						instanceConfig = bootstrapper.getInstanceRegistry().getConfig()

						instanceDb = new Sequelize(instanceConfig.db.name, wrapperConfig.db.user, wrapperConfig.db.pass, wrapperConfig.db.config)

						out.push instanceDb

						return

		return f
	.then () =>
		return out

