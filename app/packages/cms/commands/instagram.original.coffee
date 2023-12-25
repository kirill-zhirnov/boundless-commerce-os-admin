Q = require 'q'
pathAlias = require 'path-alias'
BasicCommand = pathAlias '@modules/commands/basic'
wrapperBootstrap = pathAlias '@modules/bootstrap/wrapper'
instances = pathAlias '@modules/instances'
registry = pathAlias '@registry'

InstagramRequester = pathAlias '@p-cms/modules/instagramRequester'

class InstagramCommand extends BasicCommand
	actionGetMedia: ->
		deferred = Q.defer()

		wrapperBootstrap('setupInstances')
		.then () =>
			return instances.loadCachedData()
		.then (data) =>
			keys = Object.keys(data.instances)

			f = Q()

			for instId in keys
				do (instId) =>
					f = f.then () =>
						defItem = Q.defer()

						@getInstanceMedia instId
						.then () =>
							defItem.resolve()
						.catch (e) =>
							console.error "Error for instance: #{instId}", e

							defItem.resolve()
						.done()

						return defItem.promise

			return f
		.then () =>
			deferred.resolve()
		.catch (e) ->
			deferred.reject e
		.done()

		return deferred.promise

	actionGetInstanceMedia: () ->
		deferred = Q.defer()

		instId = @getOption 'instance'

		if !instId?
			console.error 'No instance id specified'
			return;

		wrapperBootstrap('setupInstances')
		.then () =>
			return @getInstanceMedia instId
		.then () =>
			deferred.resolve()
		.catch (e) ->
			deferred.reject e
		.done()

		return deferred.promise

	getInstanceMedia: (instId) ->
		deferred = Q.defer()

		instanceRegistry = registry.getRegistryByInstance instId
		db = instanceRegistry.getDb()

		Q db.model('instagramConfig').findAll()
		.then (rows) =>
			f = Q()

			for row in rows
				if !row.getAccessToken()
					continue

				do (row) =>
					f = f.then () =>
						defItem = Q.defer()

						ir = new InstagramRequester instanceRegistry, row
						ir.getSelfMedia()
						.then () =>
							defItem.resolve()
						.catch (e) ->
							console.error "Error for instance: #{instId}", e

							defItem.resolve()
						.done()

						return defItem.promise

			return f
		.then () =>
			deferred.resolve()
		.catch (e) ->
			deferred.reject e
		.done()

		return deferred.promise

module.exports = InstagramCommand
