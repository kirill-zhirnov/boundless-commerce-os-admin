pathAlias = require 'path-alias'
BaseProvider = pathAlias '@p-orders/modules/sms/providers/base'
UniSender = require 'unisender'

class UnisenderProvider extends BaseProvider
	constructor: (@row, @lang) ->
		@api = new UniSender({
			api_key: @row.settings.apiKey
			lang: @lang.code
		})

	send: (recipient, message) ->
		return @getApi().sendSms({
			phone: recipient,
			text: message
		})

	getApi: ->
		return @api

module.exports = UnisenderProvider