const Base = require('./base');

class PaidDeactivated extends Base {
	constructor(...args) {
		super(...args);

		this.alias = 'paidDeactivated';
		this.notificationPath = `@p-system/notifications/${this.alias}`;
	}
}

module.exports = PaidDeactivated;