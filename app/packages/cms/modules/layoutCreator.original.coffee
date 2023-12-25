Q = require 'q'
doT = require 'dot'
fs = require 'fs'
pathAlias = require 'path-alias'
_ = require 'underscore'
BlockSample = pathAlias '@p-theme/blockSamples/blockSample'

module.exports.create = (instanceRegistry, i18n, page) ->
	if page.type == 'landing'
		return @createLanding instanceRegistry, i18n, page
	else
		return @createPage instanceRegistry, i18n, page

module.exports.createLanding = (instanceRegistry, i18n, page) ->
	deferred = Q.defer()

	Q.nfcall(fs.readFile, pathAlias.resolve('@p-cms/modules/samples/landingLayout.dot'), 'utf8')
	.then (rawLayoutTpl) =>
		layoutTplFunc = doT.template rawLayoutTpl, _.extend({}, doT.templateSettings, {
			strip : false
		})
		layoutJadeSource = layoutTplFunc {
			pageId : page.page_id
		}

		return Q.nfcall fs.writeFile, "#{instanceRegistry.getInstancePath()}/home/landings/page#{page.page_id}.jade", layoutJadeSource, 'utf8'
	.then () ->
		deferred.resolve()
	.catch (e) ->
		deferred.reject e
	.done()

	return deferred.promise

module.exports.createPage = (instanceRegistry, i18n, page) ->
	deferred = Q.defer()

	Q.all([
		@getContent(i18n),
		Q.nfcall(fs.readFile, pathAlias.resolve('@p-cms/modules/samples/pageLayout.dot'), 'utf8')
	])
	.spread (pageContent, rawLayoutTpl) =>
		layoutTplFunc = doT.template rawLayoutTpl, _.extend({}, doT.templateSettings, {
			strip : false
		})
		layoutJadeSource = layoutTplFunc {
			pageId : page.page_id
			pageContent : pageContent
		}

		return Q.nfcall fs.writeFile, "#{instanceRegistry.getInstancePath()}/home/pages/page#{page.page_id}.jade", layoutJadeSource, 'utf8'
	.then () ->
		deferred.resolve()
	.catch (e) ->
		deferred.reject e
	.done()

	return deferred.promise

module.exports.getContent = (i18n) ->
	sample = new BlockSample 'text/text', i18n
	return sample.make 'block-1', 2