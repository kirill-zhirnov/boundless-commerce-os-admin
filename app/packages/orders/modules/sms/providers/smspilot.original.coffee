Q = require 'q'
http = require 'http'
pathAlias = require 'path-alias'
querystring = require 'querystring'
BaseProvider = pathAlias '@p-orders/modules/sms/providers/base'

class Smspilot extends BaseProvider
	send: (recipient, message) ->
		deferred = Q.defer()

		uri = [
			'http://smspilot.ru/api.php',
			'?send=', querystring.escape( message ),
			'&to=', recipient,
			'&from=', @row.settings.from,
			'&apikey=', @row.settings.apiKey,
			'&format=json'
		].join('');

		req = http.get uri, (res) ->
			str = ''
			res.on 'data', (chunk) ->
				str += chunk;

			res.on 'end', () ->
				try
					parsedData = JSON.parse(str);
				catch e
					deferred.reject str
					return

				if 'error' of parsedData
					deferred.reject parsedData
					return

				deferred.resolve()

		req.on 'error', (err) ->
			deferred.reject err

		return deferred.promise

module.exports = Smspilot