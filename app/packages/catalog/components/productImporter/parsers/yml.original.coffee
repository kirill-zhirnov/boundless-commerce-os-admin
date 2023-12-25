Q = require 'q'
fs = require 'fs'
xml2js = require 'xml2js'
_ = require 'underscore'
Entities = require('html-entities').XmlEntities
entities = new Entities()
pathAlias = require 'path-alias'
validator = pathAlias '@modules/validator/validator'
Iconv = require('iconv').Iconv
sax = require('sax')

class ProductImportParserYml
	constructor: (@filePath, @settings = {}) ->
		@data = null
		@rowsNumber = null
		@currentRow = 1

	parse: (saveRowCb) ->
		return @loadFile()
		.then () =>
			return @processCategories saveRowCb
		.then () =>
			return @processOffers saveRowCb

	loadFile: () ->
		deferred = Q.defer()

		parser = null
		Q.nfcall fs.readFile, @filePath
		.then (result) =>
			return @convertXMLToUtf8(result)
		.then (content) =>
			parser = new xml2js.Parser({
				trim: true
				explicitArray: false
			})

			return Q.nfcall parser.parseString, content
		.then (data) =>
			if data['yml_catalog']?['shop']?
				@data = data['yml_catalog']['shop']
			else
				throw new Error("Wrong YML format: yml_catalog or shop not found")

			deferred.resolve()
		.catch (e) =>
#			e = new Error("Can't parse YML file")
			e.resolve = true

			deferred.reject e
		.done()

		return deferred.promise

	processCategories: (saveRowCb) ->
		if !@data['categories']? || !_.isArray(@data['categories']['category'])
			return Q()

		f = Q()
		for category in @data['categories']['category']
			do (category) =>
				f = f.then () =>
					return saveRowCb @extractCategoryData(category)

		return f

	extractCategoryData: (row) ->
		out = {
			'!essence': 'category'
			category: row._
			external_category_id: row['$'].id
		}

		if row['$'].parentId
			out.external_parent_id = row['$'].parentId

		return out

	processOffers: (saveRowCb) ->
		if !@data['offers']? || !_.isArray(@data['offers']['offer'])
			return Q()

		deferred = Q.defer()

		f = Q()

		for offer in @data['offers']['offer']
			do (offer) =>
				f = f.then () =>
					return saveRowCb @extractOfferData(offer)

		f
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	extractOfferData: (row) ->
#		'basic' is for "simplified" type: https://yandex.ru/support/partnermarket/offers.html
		type = 'basic'
		if row['$'].type == 'vendor.model' && row.model && row.vendor
#			type: https://yandex.ru/support/partnermarket/export/vendor-model.html
			type = 'vendorModel'

		out =
			external_id: row['$'].id
			external_category_id: row['categoryId']

		switch type
			when 'basic'
				out.name = entities.decode(row['name'])

			when 'vendorModel'
				out.name = entities.decode(row['model'])

		if row.$.group_id
			out.offerGroupId = row.$.group_id

		if @settings.priceKey
			if row.price
				out[@settings.priceKey] = row.price

			if row.oldprice
				out["#{@settings.priceKey}_old"] = row.oldprice

		if row['picture']
			images = []
			if !Array.isArray(row['picture'])
				row['picture'] = [row['picture']]

			for pictureItem in row['picture']
				pictureUrl = pictureItem
				if _.isObject(pictureItem)
					if pictureItem._
						pictureUrl = pictureItem._
					else if pictureItem.$?.url?
						pictureUrl = pictureItem.$.url

				images.push {
					src : entities.decode(pictureUrl)
				}

			if images.length > 0
				out.images = images

		if row['description']
			out.description = entities.decode row['description']

		if row['vendor']
			out.manufacturer = entities.decode row['vendor']

		if row['typePrefix']
			out.commodity_group = entities.decode row['typePrefix']

		if row['vendorCode']
			out.sku = entities.decode row['vendorCode']

		if row['param']
			params = []
			if !Array.isArray(row['param'])
				row['param'] = [row['param']]

			for paramItem, i in row['param']
				if !paramItem._ || !paramItem.$?.name?
					continue

				paramName = validator.trim paramItem.$.name
				paramVal = validator.trim paramItem._

				if !paramName || !paramVal
					continue

				params.push {
					name : paramName
					value : entities.decode(paramVal)
				}

			if params.length > 0
				out.params = params

		if row['$'].available
			inStock = String(row['$'].available).toLowerCase()
			out.inStock = if inStock == 'true' then true else false
		else if row['instock']
			inStock = String(entities.decode(row['instock'])).toLowerCase()
			out.inStock = if inStock == 'да' then true else false

		return out

	convertXMLToUtf8: (content) ->
		deferred = Q.defer()

		saxParser = sax.parser(true, {
			trim: true,
			normalize: true,
		});

		encoding = null
		saxParser.onprocessinginstruction = (val) =>
			if val && val.body
				encoding = @detectEncoding(val.body)

		saxParser.onend = () ->
			deferred.resolve()

		saxParser.onerror = (e) ->
			deferred.reject(e)

		saxParser.write(content).close()

		return deferred.promise
		.then () =>
			if encoding && encoding != 'UTF-8'
				iconv = new Iconv(encoding, 'UTF-8')
				content = iconv.convert(content).toString()

			return content

	detectEncoding: (xmlDefinition) ->
		res = /encoding=("|')([^"']+)("|')/i.exec(xmlDefinition)
		if !res
			return null

		encoding = res[2].toUpperCase()
		switch encoding
			when 'WINDOWS-1251'
				encoding = 'CP1251'

			when 'UTF8'
				encoding = 'UTF-8'

		return encoding

module.exports = ProductImportParserYml