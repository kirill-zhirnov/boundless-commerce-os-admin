const validator = require('../validator/validator');
const toString = require('../validator/toString');

module.exports = {
	// toString: validator.toString,
	toString: toString,

	toDate : validator.toDate,

	toFloat : validator.toFloat,

	toInt(input, options = {}) {
		return validator.toInt.call(validator, input, options.radix);
	},

	toBoolean(input, options = {}) {
		return validator.toBoolean.call(validator, input, options.strict);
	},

	trim(input, options = {}) {
		return validator.trim.call(validator, input, options.chars);
	},

	ltrim(input , options = {}) {
		return validator.ltrim.call(validator, input, options.chars);
	},

	rtrim(input, options = {}) {
		return validator.rtrim.call(validator, input, options.chars);
	},

	escape : validator.escape,

	stripLow(input, options = {}) {
		return validator.stripLow.call(validator, input, options.keep_new_lines);
	},

	whitelist(input, options = {}) {
		return validator.whitelist.call(validator, input, options.chars);
	},

	blacklist(input, options = {}) {
		return validator.blacklist.call(validator, input, options.chars);
	},

	normalizeEmail(email, options = {}) {
		return validator.normalizeEmail.call(validator, email, options);
	},

	toNumber(input) {
		if (input === null || input === '' || typeof input === 'undefined') {
			return input;
		}

		input = String(input).replace(',', '.');

		return Number(input);
	}
};