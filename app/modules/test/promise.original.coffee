EventEmitter = require('events').EventEmitter

class Promise extends EventEmitter
	constructor : ->

	then : (callback) ->
		@on 'resolve', callback

		return @

	catch : (callback) ->
		@on 'reject', callback
		return @

	done : ->
		return @

module.exports = Promise