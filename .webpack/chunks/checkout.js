const pathAlias = require('path-alias');

let filesList = [
	'@p-orders/vue/checkout/Basket',
	'@p-orders/vue/checkout/Payment',
	'@p-orders/vue/checkout/Payment/Confirm',
];

filesList = filesList.map((filePath) => {
	return pathAlias.resolve(filePath);
});

module.exports = filesList;