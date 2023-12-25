pathAlias = require 'path-alias'
_ = require 'underscore'
wrapperRegistry = pathAlias '@wrapperRegistry'
utils = pathAlias '@utils'
registry = pathAlias '@registry'

class InstanceUnLoader
	constructor : (@instanceId) ->
		@registry = null

	run : ->
		return utils.runFlow @, [
			'setupRegistry',
			'disconnectDb',
			'clearCache',
			'unsetRegistry'
		]

	setupRegistry : ->
		if registry.hasInstanceRegistry @instanceId
			@registry = registry.getRegistryByInstance @instanceId

	disconnectDb : ->
		if @registry && @registry.has 'db'
			return @registry.getDb().close()

	clearCache : ->
		if @registry && @registry.has 'cache'
			return @registry.getCache().clean()

	unsetRegistry : ->
		if @registry
			@registry.variables = {}
			registry.rmRegistryByInstance @instanceId
			@registry = null

module.exports = InstanceUnLoader