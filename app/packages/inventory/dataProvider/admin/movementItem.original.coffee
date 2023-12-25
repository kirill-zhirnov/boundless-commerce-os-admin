pathAlias = require 'path-alias'
ChangeQtyDataProvider = pathAlias '@p-inventory/dataProvider/admin/changeQty'
Q = require 'q'

class MovementItem extends ChangeQtyDataProvider
	getRules: ->
		return [
			['movement_item_id', 'safe']
		].concat(super)

	createQuery: ->
		super

		@q.where 'mi.movement_id = (
			select
				movement_id
			from
				inventory_movement_item
			where
				movement_item_id = ?
		)', @getSafeAttr('movement_item_id')

	loadMovement : () ->
		deferred = Q.defer()

		@getDb().sql "
			select
				distinct
				m.notes,
				to_char(m.ts, :dateFormat) as ts,
				ot.title as reason,
				p.email,
				coalesce(i.product_id, v.product_id) as product_id
			from
				inventory_movement m
				inner join inventory_movement_item mi on m.movement_id = mi.movement_id
				inner join inventory_option o on o.option_id = m.reason_id
				inner join inventory_option_text ot on ot.option_id = o.option_id and ot.lang_id = :lang
				left join person p on p.person_id = m.person_id
				inner join inventory_item i on i.item_id = mi.item_id
				left join variant v on v.variant_id = i.variant_id
			where
				mi.movement_item_id = :id
		", {
			dateFormat : 'DD.MM.YYYY HH24:MI'
			id : @pk
			lang : @getEditingLang().lang_id
		}
		.then (rows) =>
			if !rows[0]
				throw new Error "Movement item with ID '#{@pk}' not found!"

			deferred.resolve rows[0]
		.done()

		return deferred.promise

	getPageSize : ->
		return false

	getTplData : ->
		deferred = Q.defer()

		out = null
		super
		.then (data) =>
			out = data
			out.movementItemId = @pk
			out.attrs = {}

			Q.all([@loadMovement()])
		.then (result) =>
			[out.movement] = result

			deferred.resolve out
		.done()

		return deferred.promise

module.exports = MovementItem