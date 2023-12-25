const validator = require('validator');
const Q = require('q');
const _ = require('underscore');

const sanitizers = [
	'toString', 'toDate', 'toFloat', 'toInt', 'toBoolean', 'trim', 'ltrim', 'rtrim', 'escape',
	'stripLow', 'whitelist', 'blacklist', 'normalizeEmail'
];

validator.validate = function(validatorName, ...args) {
	const result = this[validatorName].apply(validator, args);

	return this.processResult(validatorName, result);
};

validator.processResult = function(validatorName, result) {
	if (result === false) {
		return {
			code : validatorName
		};
	} else if (Q.isPromise(result) || (result === true) || (_.isObject(result) && result.code)) {
		return result;
	} else {
		throw new Error(`Validator '${validatorName}' returns incorrect value!`);
	}
};

validator.async = async function(validatorName, ...args) {
	return await this.validate.apply(this, arguments);

	// if (Q.isPromise(result)) {
	// 	result
	// 	.then(() => deferred.resolve(true)).catch(error => deferred.reject(error)).done();
	// } else if (result === true) {
	// 	deferred.resolve(true);
	// } else {
	// 	deferred.reject(result);
	// }
	//
	// return deferred.promise;
};

validator.isSanitizer = methodName => sanitizers.indexOf(methodName) !== -1;

validator.isDotNumeric = function(value) {
	value = String(value);
	value = value.replace(',', '.');

	if (/^\d+(\.\d+)?$/.test(value)) {
		return value;
	} else {
		return false;
	}
};

validator.trim = function(str, chars) {
	if (!str) {
		return str;
	}

	str = String(str);
	const pattern = chars ? new RegExp('^[' + chars + ']+|[' + chars + ']+$', 'g') : /^\s+|\s+$/g;

	return str.replace(pattern, '');
};

module.exports = validator;
