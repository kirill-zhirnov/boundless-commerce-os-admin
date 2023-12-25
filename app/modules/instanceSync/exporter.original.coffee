_ = require 'underscore'

class Exporter
	constructor : ->
		@instances = null
		@reset()

	set : (type, id, instance) ->
		if !_.isFunction(instance.serialize)
			throw new Error "Instance does not have method serialize"

		if !(type of @instances)
			throw new Error "Incorrect type!"

		@instances[type][id] = instance

		return @

	get : (type, id) ->
		if type of @instances && id of @instances[type]
			return @instances[type][id]

		return null

#	Prepare data for export to client side.
#	Convert hashes to Array - it will take less size
	export : ->
		out = {}

		for type, instances of @instances
			dataOfType = {}

			for id, instance of instances
				dataOfType[id] = instance.serialize()

			if _.size(dataOfType) > 0
				out[type] = dataOfType

		return out

	reset : ->
		@instances = {
			widget : {}
			model : {}
			collection : {}
		}

		return @

module.exports = Exporter