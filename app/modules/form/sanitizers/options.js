const _ = require('underscore');
const Q = require('q');
const toString = require('../../validator/toString');

// Available options:
// - options
// - multiple:false
module.exports = i18n => (function (value, options, key, attributes, form) {
	let out;
	_.defaults(options, {
		multiple: false
	});

	const deferred = Q.defer();

	if (options.multiple) {
		out = [];

		if (!_.isArray(value)) {
			value = [];
		}
	} else {
		out = null;
		value = toString(value);
	}

//		if "options" is string - it is key in @rawOptions, resolve it via form.
	let optionsValues = options.options;
	if (_.isString(optionsValues)) {
		optionsValues = form.getOptions(optionsValues);
	}

	Q()
		.then(() => optionsValues).then(function (optionsArr) {
		const optionsKeys = form.getOptionsKeys(optionsArr);

		if (options.multiple) {
			for (let itemValue of Array.from(value)) {
				itemValue = toString(itemValue);
				if (_.indexOf(optionsKeys, itemValue) !== -1) {
					out.push(itemValue);
				}
			}
		} else {
			if (_.indexOf(optionsKeys, value) !== -1) {
				out = value;
			}
		}

		return deferred.resolve(out);
	}).done();

	return deferred.promise;
});