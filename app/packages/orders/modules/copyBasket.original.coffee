pathAlias = require 'path-alias'
Q = require 'q'
FakeUser = pathAlias '@p-auth/modules/fakeUser'
Basket = pathAlias '@p-orders/modules/basket'

module.exports.copy = (instanceRegistry, fromPersonId, toBasket) ->
	deferred = Q.defer()

	fakeUser = new FakeUser()
	fakeBasket = null

	Q()
	.then () =>
		return fakeUser.setUser fromPersonId, ['guest']
	.then () =>
		fakeBasket = new Basket instanceRegistry, fakeUser

		return @copyBasketItems fakeBasket, toBasket
	.then () =>
		return fakeUser.destroy()
	.then () =>
		deferred.resolve()
	.catch (e) =>
		deferred.reject e
	.done()

	return deferred.promise

module.exports.copyBasketItems = (fromBasket, toBasket) ->
	deferred = Q.defer()

	currentBasketItems = null
	toBasket.getItems()
	.then (result) =>
		currentBasketItems = result

		return fromBasket.getItems()
	.then (oldItems) =>
		funcs = []
		for oldItem in oldItems.items
			if !@ifItemInBasket(currentBasketItems.items, oldItem.item_id)
				f = ((item) =>
					return =>
						return toBasket.addItem(item.item_id, item.qty, item.price_id, item.basic_price, item.final_price, item.discount_amount, item.discount_percent)
				)(oldItem)
				funcs.push f

		result = Q()
		funcs.forEach (f) ->
			result = result.then f

		return result
	.then () =>
		deferred.resolve()
	.done()

	return deferred.promise

module.exports.ifItemInBasket = (items, itemId) ->
	for item in items
		if item.item_id  == itemId
			return true

	return false