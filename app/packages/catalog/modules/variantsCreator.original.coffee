Q = require 'q'
_ = require 'underscore'

class VariantsCreator
	###*
		@characteristics - Array, which will be used for variant creation.
		[
			{
				id: characteristic_id,
				title: 'characteristic title',
				option: [
					[caseId, caseTitle]
				]
			},
    		...
		]
	###
	constructor : (@characteristics, @product, @db, @langId, @trx = null) ->
		@funcs = []

	create : ->
		@makeVariants @characteristics

		result = Q()
		@funcs.forEach (f) ->
			result = result.then f

		return result

	makeVariants : (characteristics, globalCases = []) ->
		characteristic = characteristics[0]

		for itemCase in characteristic.option
			item =
				characteristic_id : characteristic.id
				option : itemCase

			localCases = _.map(globalCases, _.clone).concat(item)
			if characteristics[1]
				next = characteristics.slice 1
				@makeVariants next, localCases
			else
				f = ((localCases) =>
					return =>
						return @makeVariantRow(localCases)
				)(localCases)
				@funcs.push f

	###*
	cases - Array, with characteristic and cases:
	[
		{
			characteristic_id: characteristicId,
			option : [caseId, caseTitle]
		},
		...
	]

    Returns a Promise, which resolves with variantId
	###
	makeVariantRow : (cases, saveCharacteristicsRel = false) ->
		variant = null
		variantId = null

		return @findVariantRowByCases(cases)
		.then (row) =>
			if row
				variant = row
				if row.deleted_at
					return @db.model('variant').recover {
						where :
							variant_id : row.variant_id
						transaction : @trx
					}
			else
				return @createVariantRow(cases)
		.then (res) =>
			variantId = null

			if res && res.variant_id
				variantId = res.variant_id
			else
				variantId = variant.variant_id

			if saveCharacteristicsRel
				return @saveCharacteristicsRel cases
		.then () ->
			return variantId

	createVariantRow : (cases) ->
		meta = @createVariantMeta cases

		return Q(@db.model('variant').find {
			where :
				product_id: @product.product_id
				sku: meta.sku
			transaction : @trx
		})
		.then (row) =>
			if row
				return row
			else
				return @buildVariantRow meta, cases

	buildVariantRow : (meta, cases) ->
		VariantValModel = @db.model('characteristicVariantVal')
		VariantModel = @db.model('variant')

		variant = VariantModel.build()
		variant.set {
			product_id : @product.product_id
			sku : meta.sku
		}

		return Q(variant.save({transaction : @trx}))
		.then () =>
			return @db.model('variantText').update {
				title : meta.title
			}, {
				where :
					variant_id : variant.variant_id
					lang_id : @langId
				transaction : @trx
			}
		.then () =>
			funcs = []
			for item in cases
				f = ((item) =>
					return =>
						row = VariantValModel.build()
						row.set {
							variant_id : variant.variant_id
							characteristic_id : item.characteristic_id
							case_id : item.option[0]
							rel_type : 'variant'
						}
						return row.save({transaction : @trx})
				)(item)
				funcs.push f

			result = Q()
			funcs.forEach (f) ->
				result = result.then f

			return result
		.then () =>
			return variant

	createVariantMeta : (cases) ->
		sku = []
		if @product.sku?
			sku.push @product.sku

		title = []
		for item in cases
			sku.push item.option[1]
			title.push item.option[1]

		return {
			sku : sku.join('-')
			title : title.join('-')
		}

	findVariantRowByCases : (cases) ->
		casesForSearch = []
		for item, i in cases
			casesForSearch.push item.option[0]

		return @db.model('variant').findVariantByCases @product.product_id, casesForSearch, {
			transaction : @trx
		}

	###*
	Cases - see @makeVariantRow method.
	###
	saveCharacteristicsRel : (cases) ->
		f = Q()
		cases.forEach (row) =>
			f = f.then () =>
				return @db.sql("
					insert into product_variant_characteristic
						(product_id, characteristic_id, rel_type)
					values
						(:product, :charact, :type)
					on conflict
						do nothing
				", {
					product: @product.product_id
					charact: row.characteristic_id
					type: 'variant'
				})

		return f

module.exports = VariantsCreator
