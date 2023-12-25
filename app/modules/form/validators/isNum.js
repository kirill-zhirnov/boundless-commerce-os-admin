const validator = require('validator');
const _ = require('underscore');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes, form) {
	_.defaults(options, {
		allowEmpty: true,
		max: null,
		min: null,
		no_symbols: false
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (!validator.isNumeric(value, {no_symbols: options.no_symbols})) {
		return {
			code: 'isNum',
			message: i18n.__('String should contain only numbers.')
		};
	}

	value *= 1;

	if (options.max !== null) {
		if (value > options.max) {
			return {
				code: 'moreThan',
				message: i18n.__('Value should be less than %s', [options.max])
			};
		}
	}

	if (options.min !== null) {
		if (value < options.min) {
			return {
				code: 'lessThan',
				message: i18n.__('Value should be more than %s', [options.min])
			};
		}
	}

	return true;
});