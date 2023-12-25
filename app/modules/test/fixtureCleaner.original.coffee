Reader = require 'sequelize-fixtures/lib/reader.js'
Q = require 'q'
_ = require 'underscore'

reader = new Reader {
	log : console.log
}

module.exports.cleanByFile = (file, models) ->
	deferred = Q.defer()

	reader.readFile file
	.then (data) ->
		funcs = []
		for i in [(data.length - 1) .. 0]
			Model = models[data[i].model]
			pk = _.pick data[i].data, Model.primaryKeyAttributes

			if _.size(pk) != Model.primaryKeyAttributes.length
				pk = data[i].data

			funcs.push ((Model, pk) ->
				return ->
					return Q(Model.destroy {where : pk})
			)(Model, pk)

		result = Q()
		funcs.forEach (f) ->
			result = result.then(f)

		result
		.then () ->
			deferred.resolve()
		.done()
	.done()

	return deferred.promise
