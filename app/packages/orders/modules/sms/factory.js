// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const pathAlias = require('path-alias');

const Unisender = pathAlias('@p-orders/modules/sms/providers/unisender');
const Smspilot = pathAlias('@p-orders/modules/sms/providers/smspilot');

module.exports.createProvider = function(row, lang) {
	let provider;
	switch (row.alias) {
		case 'unisender':
			provider = new Unisender(row, lang);
			break;
		case 'smspilot':
			provider = new Smspilot(row);
			break;
		default:
			provider = null;
	}

	return provider;
};