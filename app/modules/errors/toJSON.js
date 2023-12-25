// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Object.defineProperty(Error.prototype, 'toJSON', {
	value() {
		const alt = {};
		Object.getOwnPropertyNames(this).forEach( function(key) {
			let val = this[key];

			if (val && (typeof(val.toJSON) === 'function')) {
				val = val.toJSON();
			}

			return alt[key] = val;
		}
		, this);

		alt.name = this.name;

		return alt;
	},

	configurable: true
});