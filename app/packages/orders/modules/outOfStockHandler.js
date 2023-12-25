const _ = require('underscore');

module.exports.process = async function (e, controller, lang) {
	const inventoryItem = await controller.getModel('inventoryItem').getVwInventoryItem(e.itemId, lang.lang_id);

	const title = [];
	switch (inventoryItem.type) {
		case 'custom_item':
			title.push(inventoryItem.custom_item.title);
			break;
		case 'product':
			title.push(inventoryItem.product.title);
			break;
		case 'variant':
			title.push(inventoryItem.product.title);
			title.push(inventoryItem.variant.title);
			break;
	}

	controller.alertDanger(
		controller.getI18n().__('Cannot make reserve. Item "%s" has only %s qty, you requested %s', [
			title.join(','),
			inventoryItem.available_qty,
			e.requestedQty
		])
	);
};

module.exports.isStockError = function (e) {
	if (_.isObject(e) && !_.isUndefined(e.code) && (e.code === 'notEnoughStock')) {
		return true;
	}

	return false;
};
