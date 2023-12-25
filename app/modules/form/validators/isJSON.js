const validator = require('validator');
const _ = require('underscore');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes, form) {
	_.defaults(options, {
		allowEmpty: true
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (validator.isJSON(value)) {
		return true;
	}

	return {
		code: 'isJSON',
		message: i18n.__('String should be a valid JSON.')
	};
});