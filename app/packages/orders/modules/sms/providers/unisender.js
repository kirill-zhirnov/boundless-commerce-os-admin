// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const BaseProvider = pathAlias('@p-orders/modules/sms/providers/base');
const UniSender = require('unisender');

class UnisenderProvider extends BaseProvider {
	constructor(row, lang) {
		this.row = row;
		this.lang = lang;
		this.api = new UniSender({
			api_key: this.row.settings.apiKey,
			lang: this.lang.code
		});
	}

	send(recipient, message) {
		return this.getApi().sendSms({
			phone: recipient,
			text: message
		});
	}

	getApi() {
		return this.api;
	}
}

module.exports = UnisenderProvider;