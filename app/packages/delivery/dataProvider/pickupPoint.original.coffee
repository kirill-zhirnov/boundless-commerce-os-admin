Q = require 'q'
pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'

class PickupPoint extends DataProvider
	constructor: ->
		super

		@paymentMethodAlias = null

	getRules: ->
		return [
			['city, point, paymentMethod', 'isNum']
			['delivery', 'safe']
			['paymentMethod', 'validatePaymentMethod']
		].concat(super)

	createQuery: ->
		@q.field 'delivery_id'

		@q.field 'shipping_pickup.point_id'
		@q.field 'shipping_pickup.city_id'
		@q.field 'shipping_pickup.local_id'
		@q.field 'shipping_pickup.coordinate'
		@q.field 'shipping_pickup.possibility_to_pay_for_order'

		@q.field 'shipping_pickup_text.title'
		@q.field 'shipping_pickup_text.address'
		@q.field 'shipping_pickup_text.phone'
		@q.field 'shipping_pickup_text.work_schedule'

		@q.from('delivery')
		@q.join('shipping_pickup', null, 'delivery.shipping_id = shipping_pickup.shipping_id')
		@q.join('shipping_pickup_text', null, 'shipping_pickup.point_id = shipping_pickup_text.point_id')

		@q.where 'delivery.deleted_at is null'
		@q.where 'shipping_pickup.deleted_at is null'
		@q.where('shipping_pickup.city_id = ?', @getSafeAttr('city'))
		@q.where('shipping_pickup_text.lang_id = ?', @getLang().lang_id)

		delivery = @getSafeAttr('delivery')
		if delivery
			delivery = String(delivery).split('.')[0]
			@q.where('delivery.delivery_id = ?', delivery)

		if @paymentMethodAlias == 'cashOnDelivery'
			@q.where('shipping_pickup.possibility_to_pay_for_order = true')

		@q.order('shipping_pickup_text.title')

		@compare 'shipping_pickup.point_id', @getSafeAttr('point')

	getPageSize : ->
		return false

	setupPaymentMethodByAlias: (paymentMethod) ->
		return@getDb().sql "
			select
				alias
			from
				payment_gateway
				inner join payment_method using(payment_gateway_id)
			where
				payment_method_id = :paymentMethod
		", {
			paymentMethod: paymentMethod
		}
		.then (rows) =>
			if rows[0]
				@paymentMethodAlias = rows[0].alias

			return

	validatePaymentMethod : (val) ->
		if @hasErrors('paymentMethod') || !val
			return

		return @setupPaymentMethodByAlias(val)

module.exports = PickupPoint