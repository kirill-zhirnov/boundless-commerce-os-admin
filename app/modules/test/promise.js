// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
    EventEmitter
} = require('events');

class Promise extends EventEmitter {
	constructor() {}

	then(callback) {
		this.on('resolve', callback);

		return this;
	}

	catch(callback) {
		this.on('reject', callback);
		return this;
	}

	done() {
		return this;
	}
}

module.exports = Promise;