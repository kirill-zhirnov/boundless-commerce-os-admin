const extend = require('extend');
const Q = require('q');
const _ = require('underscore');
const toString = require('../../validator/toString');

// Available options:
// - model - required
// - field - if not specified - will be taken from key (attribute name)
// - criteria || {}
// - message || null - Error message.
// - allowEmpty:true - if true - do not validate empty strings
module.exports = i18n => (function (value, options, key, attributes) {
	_.defaults(options, {
		allowEmpty: true
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	if (!options.model) {
		throw new Error('You must specify model!');
	}

	const deferred = Q.defer();

	Q(options.model.count(buildCriteria(value, options, key)))
		.then(result => {
			if (result === 0) {
				let message = options.message || i18n.__('Value "%s" was not found.');
				message = i18n.sprintf(message, value);

				return deferred.reject({
					code: 'rowNotExist',
					message
				});
			} else {
				return deferred.resolve();
			}
		}).done();

	return deferred.promise;
});


var buildCriteria = function (value, options, key) {
	let criteria = {
		where: {}
	};

	const field = options.field || key;
	criteria.where[field] = value;

	if (options.criteria) {
		criteria = extend(true, criteria, options.criteria);
	}

	return criteria;
};
