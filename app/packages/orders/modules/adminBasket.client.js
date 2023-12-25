const $ = require('jquery');
const ajax = require('../../../modules/ajax/kit.client');
const priceCalculator = require('../components/priceCalculator');

module.exports.addProduct = function (productId, orderId = null) {
	const params = {product: productId};
	if (orderId != null) {
		params.orderId = orderId;
	}

	return ajax.get(['catalog/admin/product/toBasket', params])
		.then(res => {
			if (res.result) {
				this.triggerRefreshed();
			}

			return res;
		});
};

module.exports.triggerRefreshed = () => $(document).trigger('refreshed.basket');

module.exports.calcFinalPrice = (basicPrice, discountAmount = null, discountPercent = null) => priceCalculator.calcFinalPrice(basicPrice, discountAmount, discountPercent);

module.exports.calcTotalPrice = (finalPrice, qty) => priceCalculator.calcTotalPrice(finalPrice, qty);
