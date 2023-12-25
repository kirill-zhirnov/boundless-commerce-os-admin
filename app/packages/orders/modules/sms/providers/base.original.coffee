class SmsProvider
	constructor: (@row) ->
		return

	getAlias: () ->
		return @row.alias

	getServiceId: () ->
		return @row.service_id

	send: () ->
		throw new Error('Method should be overwritten by child class')

module.exports = SmsProvider