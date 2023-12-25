Q = require 'q'
https = require 'https'
http = require 'http'
fs = require 'fs'
path = require 'path'
randomPath = require '../../../modules/randomPath/index'
url = require 'url'
_ = require 'underscore'
fileType = require 'file-type'
readChunk = require 'read-chunk'

class Downloader
	constructor: (@instanceRegistry, @path, @options = {}) ->
		@localPrefix = ''

		if !path.isAbsolute(@path)
			@localPrefix = @path
			@path = @instanceRegistry.getDataPath()

		if @options.contentType && !_.isArray(@options.contentType)
			@options.contentType = [@options.contentType]

	downloadFile: (link) ->
		deferred = Q.defer()

		error = null
		fileStream = null

		parsedLink = url.parse link

		fileName = path.basename parsedLink.pathname
		httpModule = if parsedLink.protocol == 'https:' then https else http

		relativePath = "#{@localPrefix}/" + randomPath.getByFileName "#{@path}/#{@localPrefix}/", fileName
		absolutePath = "#{@path}/#{relativePath}"

# 		Fixme: to allow https connections:
#		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

		reqOptions =
			hostname : parsedLink.hostname,
			path : encodeURI(parsedLink.path),
			method : 'GET',
			headers :
				'User-Agent': 'Selliosbot/1.0 (+https://sellios.ru)'

		if parsedLink.port
			reqOptions.port = parsedLink.port

		try
			request = httpModule.request reqOptions, (res) =>
				error = @checkHeaders(res)

				if error
					handleError(error)

				fileStream = fs.createWriteStream absolutePath
				fileSize = 0

				res.on 'error', (e) =>
					handleError(e)

				res.on 'data', (chunk) =>
					fileSize += chunk.length

					if @options.sizeLimit && @options.sizeLimit < fileSize
						return handleError new Error('File size limit reached')

				fileStream.on 'error', (e) =>
					handleError(e)

				res.pipe fileStream

				fileStream.on 'finish', () =>
					if error?
						return

					out = {
						fileName: fileName
						absolutePath: absolutePath
						relativePath: relativePath
					}

					@validateOutput out
					.then (res) =>
						deferred.resolve res
					.done()

			request.on 'error', (e) =>
				deferred.reject e
			request.end()

		catch e
			deferred.reject e

		handleError = (e) =>
			if !fileStream
				deferred.reject e
				return

			error = e
			Q.ninvoke fileStream, 'end'
			.then () =>
				Q.nfcall(fs.unlink, absolutePath)
			.then () =>
				deferred.reject e
			.catch (e) ->
				deferred.reject e
			.done()

		return deferred.promise

	validateOutput : (out) ->
		if path.extname(out.absolutePath) != ''
			return Q.resolve out

		return Q(readChunk(out.absolutePath, 0, 4100))
		.then (buffer) =>
			res = fileType(buffer)

			oldPath = out.absolutePath
			out.absolutePath += ".#{res.ext}"
			out.relativePath += ".#{res.ext}"

			return Q.nfcall(fs.rename, oldPath, out.absolutePath)
		.then () =>
			return out

	checkHeaders: (res) ->
		if res.statusCode != 200
			return new Error("Response status-code is '#{res.statusCode}'")

		headers = res.headers
		if @options.sizeLimit && headers['content-length'] && Number(headers['content-length']) > @options.sizeLimit
			return new Error('File is larger than allowed')

		if @options.contentType && !_.contains(@options.contentType, headers['content-type'])
			return new Error('Wrong file format')

		return null

module.exports = Downloader
