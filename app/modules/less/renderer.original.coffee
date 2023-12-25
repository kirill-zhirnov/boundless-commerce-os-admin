Q = require 'q'
http = require 'http'
pathAlias = require 'path-alias'
wrapperRegistry = pathAlias '@wrapperRegistry'
wrapperConfig = wrapperRegistry.getConfig()

module.exports.render = (lessContent, params = {}) ->
	deferred = Q.defer()

	postData = JSON.stringify({
		lessContent : lessContent
		params : params
	})

	req = http.request {
		hostname : wrapperConfig.lessServer.host
		port : wrapperConfig.lessServer.port
		path : '/render'
		method : 'POST'
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData)
		}
	}, (res) ->
		data = ''

		res.setEncoding('utf8')
		res.on 'error', (e) ->
			deferred.reject e

		res.on 'data', (chunk) ->
			data += chunk

		res.on 'end', () ->
			try
				parsedResult = JSON.parse(data)

				if res.statusCode == 200
					deferred.resolve parsedResult
				else
					deferred.reject parsedResult
			catch e
				deferred.reject e

	req.write(postData);
	req.on 'error', (e) ->
		deferred.reject e

		return

	req.end()

	return deferred.promise