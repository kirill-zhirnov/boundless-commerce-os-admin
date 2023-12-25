ChangeQtyDataProvider = require '../../../inventory/dataProvider/admin/changeQty'
Q = require 'q'

class ProductQtyHistory extends ChangeQtyDataProvider
	constructor : ->
		super

		@product = null

	getRules: ->
		return [
			['product_id', 'required'],
			['product_id', 'isNum'],
		].concat(super)

	createQuery: ->
		super

		@q.where 'i.product_id = ? or vp.product_id = ?', @product.product_id, @product.product_id

	setup : ->
		return super
		.then () =>
			return @setupProduct()
		.then () =>
			return

	setupProduct : ->
		return @getDb().sql "
			select
				product_id,
				count(variant_id)::int as variants
			from
				product
				left join variant using(product_id)
			where
				product_id = :product
			group by product_id
		", {
			product: @attributes.product_id
		}
		.then (rows) =>
			if !rows[0]
				throw new Error "Product not found!"

			@product = rows[0]

			return

	getTplData : ->
		return super
		.then (data) =>
			data.product = @product

			return data

module.exports = ProductQtyHistory