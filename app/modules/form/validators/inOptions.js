const _ = require('underscore');
const Q = require('q');
const toString = require('../../validator/toString');

module.exports = i18n => (function (value, options, key, attributes, form) {
	_.defaults(options, {
		allowEmpty: true,
		multiple: false,
		message: i18n.__('String is not in a list of allowed values.')
	});

	let proceed = true;

	if (options.allowEmpty && (!value || (_.isArray(value) && !value.length))) {
		return true;
	}

	const deferred = Q.defer();
	if (options.multiple) {
		if (!_.isArray(value)) {
			deferred.reject({
				code: 'inOptionsNotArr',
				message: options.message
			});
			proceed = false;
		}
	} else {
		value = [toString(value)];
	}

	if (proceed) {
		if (options.allowEmpty) {
			if (options.multiple && (value.length === 0)) {
				return true;
			} else if (!options.multiple && (value[0] === '')) {
				return true;
			}
		}

//			if "options" is string - it is key in @rawOptions, resolve it via form.
		let optionsValues = options.options;
		if (_.isString(optionsValues)) {
			optionsValues = form.getOptions(optionsValues);
		}

		Q().then(() => optionsValues).then(function (optionsArr) {
			const optionsKeys = form.getOptionsKeys(optionsArr);

			for (let item of Array.from(value)) {
				if ((item === '') && options.multiple) {
					continue;
				}

				if (optionsKeys.indexOf(item) === -1) {
					deferred.reject({
						code: 'inOptions',
						message: options.message
					});
					proceed = false;
					break;
				}
			}

			if (proceed) {
				return deferred.resolve();
			}
		}).done();
	}

	return deferred.promise;
});
