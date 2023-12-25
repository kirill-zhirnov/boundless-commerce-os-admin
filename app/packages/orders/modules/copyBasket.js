// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Q = require('q');
const FakeUser = pathAlias('@p-auth/modules/fakeUser');
const Basket = pathAlias('@p-orders/modules/basket');

module.exports.copy = function(instanceRegistry, fromPersonId, toBasket) {
	const deferred = Q.defer();

	const fakeUser = new FakeUser();
	let fakeBasket = null;

	Q()
	.then(() => {
		return fakeUser.setUser(fromPersonId, ['guest']);
})
	.then(() => {
		fakeBasket = new Basket(instanceRegistry, fakeUser);

		return this.copyBasketItems(fakeBasket, toBasket);
}).then(() => {
		return fakeUser.destroy();
	}).then(() => {
		return deferred.resolve();
	}).catch(e => {
		return deferred.reject(e);
	}).done();

	return deferred.promise;
};

module.exports.copyBasketItems = function(fromBasket, toBasket) {
	const deferred = Q.defer();

	let currentBasketItems = null;
	toBasket.getItems()
	.then(result => {
		currentBasketItems = result;

		return fromBasket.getItems();
}).then(oldItems => {
		const funcs = [];
		for (let oldItem of Array.from(oldItems.items)) {
			if (!this.ifItemInBasket(currentBasketItems.items, oldItem.item_id)) {
				const f = (item => {
					return () => {
						return toBasket.addItem(item.item_id, item.qty, item.price_id, item.basic_price, item.final_price, item.discount_amount, item.discount_percent);
					};
				}
				)(oldItem);
				funcs.push(f);
			}
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		return result;
	}).then(() => {
		return deferred.resolve();
	}).done();

	return deferred.promise;
};

module.exports.ifItemInBasket = function(items, itemId) {
	for (let item of Array.from(items)) {
		if (item.item_id  === itemId) {
			return true;
		}
	}

	return false;
};