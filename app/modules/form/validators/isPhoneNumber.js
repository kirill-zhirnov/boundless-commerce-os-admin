const _ = require('underscore');
const toString = require('../../validator/toString');
const regExp = /^\+\d{6,15}$/;

module.exports = i18n => (function (value, options, key, attributes, form) {
	//validator should consider settings from locale!!!
	return true;
	if (options == null) {
		options = {};
	}
	_.defaults(options, {
		allowEmpty: true
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (regExp.test(value)) {
		return true;
	}

	return {
		code: 'isPhoneNumber',
		message: i18n.__('Incorrect phone number. Example for correct number: +10001234567.')
	};
});