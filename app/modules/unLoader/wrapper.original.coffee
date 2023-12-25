pathAlias = require 'path-alias'
Q = require 'q'
instances = pathAlias '@modules/registry/server/instance'
wrapperRegistry = pathAlias '@wrapperRegistry'
express = require 'express'

class WrapperUnLoader
	constructor : (@server) ->

	init : ->
		process.on('SIGINT', @shutdown.bind(@))
		return

	shutdown : ->
		@server.close () =>
			@shutdownInstances()
			.then () =>
				return @shutdownWrapper()
			.then () =>
				shutProcess = () =>
					process.exit(0)

				setTimeout shutProcess, 1000
			.done()

		return

	shutdownInstances : ->
		deferred = Q.defer()

		ids = instances.getInstancesIdList()

		f = Q()

		for id in ids
			do (id) =>
				f = f.then () =>
					def = Q.defer()

					registry = instances.getRegistryByInstance id

					Q()
					.then () =>
						if registry.has('db')?
							return registry.getDb().close()
					.then () =>
						if registry.has('sphinx')
							return registry.getSphinx().close()
					.then () =>
						def.resolve()
					.catch (e) =>
						def.resolve()
					.done()

					return def.promise

		f
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.resolve()
		.done()

		return deferred.promise


	shutdownWrapper : () ->
		deferred = Q.defer()

		Q()
		.then () =>
			if wrapperRegistry.has('db')
				return wrapperRegistry.getDb().close()
		.then () =>
			if wrapperRegistry.has('sphinx')
				return wrapperRegistry.getSphinx().close()
		.then () =>
			if wrapperRegistry.has('redis')
				return wrapperRegistry.getRedis().quit()
		.then () =>
			if wrapperRegistry.has('redisMsg')
				return wrapperRegistry.getRedisMsg().quit()
		.then () =>
			if wrapperRegistry.has('redisMsgSend')
				return wrapperRegistry.getRedisMsgSend().quit()
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.resolve()
		.done()

		return deferred.promise

module.exports = WrapperUnLoader
