const validator = require('validator');
const _ = require('underscore');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes, form) {
	_.defaults(options, {
		allowEmpty: true,
		min: null
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (validator.isDotNumeric(value) === false) {
		return {
			code: 'isDotNum',
			message: i18n.__('String should contain only numbers and comma.')
		};
	}

	value = value.replace(',', '.');
	value *= 1;

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