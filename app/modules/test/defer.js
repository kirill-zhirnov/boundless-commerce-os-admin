// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('./promise');
const _ = require('underscore');

class Defer {
	constructor() {
		this.promise = new Promise;
	}

	resolve() {
		const args = _.toArray(arguments);
		args.unshift('resolve');

		this.promise.emit.apply(this.promise, args);

		return this;
	}

	reject() {
		const args = _.toArray(arguments);
		args.unshift('reject');

		return this.promise.emit.apply(this.promise, args);
	}
}

module.exports.create = () => new Defer;