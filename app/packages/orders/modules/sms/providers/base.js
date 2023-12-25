// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
class SmsProvider {
	constructor(row) {
		this.row = row;
	}

	getAlias() {
		return this.row.alias;
	}

	getServiceId() {
		return this.row.service_id;
	}

	send() {
		throw new Error('Method should be overwritten by child class');
	}
}

module.exports = SmsProvider;