Promise = require './promise'
_ = require 'underscore'

class Defer
	constructor : ->
		@promise = new Promise

	resolve : ->
		args = _.toArray arguments
		args.unshift 'resolve'

		@promise.emit.apply @promise, args

		return @

	reject : ->
		args = _.toArray arguments
		args.unshift 'reject'

		@promise.emit.apply @promise, args

module.exports.create = ->
	return new Defer