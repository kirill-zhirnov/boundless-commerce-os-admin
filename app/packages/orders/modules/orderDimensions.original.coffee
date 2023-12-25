Q = require 'q'
_ = require 'underscore'
moolah = require 'moolah'
packer = require '3d-bin-packing'
{parseString} = require 'xml2js'

class OrderDimensions
	constructor: (@instanceRegistry, @deliverySettings, @langId) ->
		@boxArray = null
		@productArray = null

	loadDeliverySettings: () ->
		return @instanceRegistry.getSettings().get('delivery', 'settings')
		.then (deliverySettings) =>
			@deliverySettings = deliverySettings

			return

	getCharacteristics: (productIds, variantIds, transition) ->
		rows = null

		return @instanceRegistry.getDb().sql "
			select
				'product' as type,
				product_id as id,
				size
			from
				product_prop
			where
				product_id in (:productIds)
			union
			select
				'variant' as type,
				variant_id as id,
				size
			from
				variant
			where
				variant_id in (:variantIds)
		", {
			productIds: productIds
			variantIds: variantIds
		}
		.then (res) =>
			rows = res

			if !@deliverySettings?
				return @loadDeliverySettings()
		.then () =>
			defaultValues = _.extend {
				weight: @deliverySettings.defaultProductWeight
			}, @deliverySettings.defaultProductDimensions

			out = {
				products: {}
				variants: {}
				default: defaultValues
			}

			for row in rows
				if row.type == 'product'
					out.products[row.id] = row.size
				else
					out.variants[row.id] = row.size

			return out

	parseItems: (items) ->
		out = {
			productIds: []
			variantIds: []
		}

		for item in items
			out.variantIds.push item.variant_id
			out.productIds.push item.product_id

		return out

	assembleCharacteristics: (items, characteristics) ->
		deferred = Q.defer()

		total = { weight: 0 }
		itemsNumber = 0

		for item in items
			itemsNumber += item.qty

			item.dimensions = _.extend(
				{},
				characteristics.default,
				characteristics.products[item.product_id],
				characteristics.variants[item.variant_id]
			)

			weight = @prepareDimensionNumber item.dimensions.weight, 0

			sumWeight = moolah(weight).times(item.qty).float()
			total.weight = moolah(total.weight).plus(sumWeight).float()

			if @deliverySettings.useDimensions
				width = @prepareDimensionNumber item.dimensions.width
				height = @prepareDimensionNumber item.dimensions.height
				length = @prepareDimensionNumber item.dimensions.length

				@productArray.insert(
					@productArray.end(), item.qty, new packer.Product(
						item.item_id,
						width,
						height,
						length
					)
				)

		Q()
		.then () =>
			if @deliverySettings.useDimensions
				return @pack(itemsNumber)
			else
				return {
					packResult: false
				}
		.then (out) =>
			_.extend total, out

			deferred.resolve {
				items: items
				total: total
			}
		.catch (e) ->
			console.error "catched packing err", e
			deferred.reject e
		.done()

		return deferred.promise

	prepareDimensionNumber: (numberStr, defaultVal = 1) ->
		numberStr = String(numberStr)
		numberStr = numberStr.replace ',', '.'

		numberStr = Number(numberStr)

		if isNaN(numberStr) || numberStr <= 0
			numberStr = defaultVal

		return numberStr

	calcOrderDimensions: (items) ->
		if items.length == 0
			return Q {
				items: items
				total: @getDefaultResult()
			}

		characteristics = null

		@resetBoxProducts()
		data = @parseItems items

		return @getCharacteristics(data.productIds, data.variantIds, data.transition)
		.then (res) =>
			characteristics = res

			if @deliverySettings.useDimensions && !@boxArray?
				return @preparePacker()
		.then () =>
			return @assembleCharacteristics items, characteristics
		.then (out) =>
			return out

	getBoxes: () ->
		return @instanceRegistry.getDb().sql "
			select
				box.*,
				box_text.title,
				length+width+height as sum_dim
			from
				box
				inner join box_text using (box_id)
			where
				lang_id = :lang
				and deleted_at is null
			order by
				sum_dim asc
		", {
			lang: @langId
		}
		.then (rows) =>
			return rows

	preparePacker: () ->
		return @getBoxes()
		.then (boxes) =>
			if boxes.length != 0
				@boxArray = new packer.WrapperArray()

				for box in boxes
					@boxArray.push(
						new packer.Wrapper("#{box.box_id}. #{box.title}", 0, Number(box.width), Number(box.height), Number(box.length), 0)
					)

			return

	resetBoxProducts: () ->
		@productArray = new packer.InstanceArray()
		return

	pack: (itemsNumber) ->
		out = @getDefaultResult()

		if !@boxArray
			return Q(out)

		deferred = Q.defer()

		Q()
		.then () =>
			myPacker = new packer.Packer(@boxArray, @productArray)
			res = myPacker.optimize()

			return Q.nfcall parseString, res.toXML().toString()
		.then (xmlObj) =>
			boxes = xmlObj.wrapperArray.instance
			packedItems = 0

			for box in boxes
				packedItems += box.wrap.length

				area = moolah( Number(box.$.width) ).times( Number(box.$.length) ).float()

				if area > out.area
					out.width = Number(box.$.width)
					out.length = Number(box.$.length)
					out.area = area

				out.boxIds.push parseInt(box.$.name)
				out.height += Number(box.$.height)

			# check if all items fit boxes
			if itemsNumber == packedItems
				out.packResult = true

			deferred.resolve out
		.catch (e) =>
			logError = true

			skipOnErrors = [
				'All instances are greater than the wrapper.'
			]

			if e && skipOnErrors.indexOf(e.message) != -1
				logError = false

			if logError
				console.error e

			deferred.resolve out
		.done()

		return deferred.promise

	getDefaultResult : ->
		return {
			packResult: false
			boxIds: []
			height: 0
			width: 0
			length: 0
			area: 0
		}

module.exports = OrderDimensions
