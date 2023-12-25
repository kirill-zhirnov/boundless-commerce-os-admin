const _ = require('underscore');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes) {
	_.defaults(options, {
		allowEmpty: true,
		message: i18n.__('Is not url: allowed only alphanumeric symbols, symbols "-" and "_".')
	});

	value = toString(value);
	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (!/\D/.test(value)) {
		return {
			code: 'urlKey',
			message: i18n.__('Url should contain not numeric symbol')
		};
	}

	if (/^[a-z0-9\-_]+$/i.test(value)) {
		return true;
	}

	return {
		code: 'urlKey',
		message: options.message
	};
});
