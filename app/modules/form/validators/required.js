const _ = require('underscore');
const validator = require('validator');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes) {
	const error = {
		code: 'required',
		message: i18n.__('Value cannot be blank.')
	};

	if (value === null) {
		return error;
	}

	value = toString(value);

	let trim = true;
	if (!_.isUndefined(options.trim)) {
		({
			trim
		} = options);
	}

	if (trim) {
		value = validator.trim(value);
	}

	if (value === '') {
		return error;
	}

	return true;
});