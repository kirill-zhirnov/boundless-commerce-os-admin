import validator from '../../modules/validator/validator';

export default function(i18n) {
	const makeResult = function(result, code, defaultMessage, options = {}, sprintfArgs = []) {
		if (result === false) {
			result = makeError(code, defaultMessage, options, sprintfArgs);
		}

		return result;
	};

	const makeError = function(code, defaultMessage, options = {}, sprintfArgs = []) {
		const result = {code};
		let message = options.message || defaultMessage;

		if (sprintfArgs.length > 0) {
			const args = [message].concat(sprintfArgs);
			message = i18n.sprintf.apply(i18n, args);
		}

		result.message = message;

		return result;
	};

	return {
		equals(input, options = {}) {
			const result = validator.equals(input, options.comparison);
			return makeResult(result, 'equals', i18n.__('Field has incorrect value.'), options);
		},

		contains(input, options = {}) {
			const result = validator.contains(input, options.seed);
			return makeResult(result, 'contains', i18n.__('Field does not contain \'%s\'.'), options, [options.seed]);
		},

		matches(str, options = {}) {
			const result = validator.matches(str, options.pattern(options.modifiers));
			return makeResult(result, 'matches', i18n.__('String does not match pattern \'%s\'.'), options, [options.pattern]);
		},

		isEmail(str, options = {}) {
			const result = validator.isEmail(str);
			return makeResult(result, 'isEmail', i18n.__('String does not contain a valid email address.'), options);
		},

		isURL(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isURL(str, options);
			return makeResult(result, 'isURL', i18n.__('String does not contain a valid URL.'), options);
		},

		isFQDN(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isFQDN(str, options);
			return makeResult(result, 'isFQDN', i18n.__('String does not contain a valid domain name.'), options);
		},

		isIP(str, options) {
			if (options == null) { options = {}; }
			if (!options.version) {
				options.version = 4;
			}

			const result = validator.isIP(str, options.version);
			return makeResult(result, 'isIP', i18n.__('String does not contain a valid IPv%s address.'), options, [options.version]);
		},

		isAlpha(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isAlpha(str, options);
			return makeResult(result, 'isAlpha', i18n.__('String should contain only letters (a-Z).'), options);
		},

		isNumeric(str, options) {
//			Back compatibility without warnings:
			if (options == null) { options = {}; }
			if ((typeof(str) === 'undefined') || (str === null)) {
				str = '';
			} else {
				str = String(str);
			}

			const result = validator.isNumeric(str, options);
			return makeResult(result, 'isNumeric', i18n.__('String should contain only numbers.'), options);
		},

		isAlphanumeric(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isAlphanumeric(str, options);
			return makeResult(result, 'isAlphanumeric', i18n.__('String should contain only letters and numbers.'), options);
		},

		isBase64(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isBase64(str);
			return makeResult(result, 'isBase64', i18n.__('String should be valid base64-string.'), options);
		},

		isHexadecimal(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isHexadecimal(str);
			return makeResult(result, 'isHexadecimal', i18n.__('String should be valid hexadecimal number.'), options);
		},

		isHexColor(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isHexColor(str);
			return makeResult(result, 'isHexColor', i18n.__('String should be valid hexadecimal color.'), options);
		},

		isLowercase(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isLowercase(str);
			return makeResult(result, 'isLowercase', i18n.__('String should be in lower case.'), options);
		},

		isUppercase(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isUppercase(str);
			return makeResult(result, 'isUppercase', i18n.__('String should be in upper case.'), options);
		},

		isInt(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isInt(str);
			return makeResult(result, 'isInt', i18n.__('String should be an integer.'), options);
		},

		isFloat(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isFloat(str);
			return makeResult(result, 'isFloat', i18n.__('String should be a float.'), options);
		},

		isDivisibleBy(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isDivisibleBy(str, options.number);
			return makeResult(result, 'isDivisibleBy', i18n.__('%s should be divisible by %s'), options, [
				str, options.number
			]);
		},

		isNull(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isNull(str);
			return makeResult(result, 'isNull', i18n.__('String should be null.'), options);
		},

		isLength(str, options = {}) {
			let args, message;
			const result = validator.isLength(str, options.min, options.max);

			if (options.max) {
				if (options.min) {
					args = [options.min, options.max];
					message = i18n.__('String length should be between %s and %s characters.');
				} else {
					args = [options.max];
					message = i18n.__('String length should be less than %s.');
				}
			} else {
				args = [options.min];
				message = i18n.__('String length should be more than %s.');
			}

			return makeResult(result, 'isLength', message, options, args);
		},

		isByteLength(str, options) {
			let args, message;
			if (options == null) { options = {}; }
			const result = validator.isByteLength(str, options.min, options.max);

			if (options.max) {
				args = [options.min, options.max];
				message = i18n.__('String size in bytes should be between %s and %s characters.');
			} else {
				args = [options.min];
				message = i18n.__('String size in bytes should be more than %s.');
			}

			return makeResult(result, 'isByteLength', message, options, args);
		},

		isUUID(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isUUID(str, options.version);
			return makeResult(result, 'isUUID', i18n.__('String should be valid UUID version %s.'), options, [
				options.version
			]);
		},

		isDate(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isDate(str);
			return makeResult(result, 'isDate', i18n.__('String should be a date.'), options);
		},

		isAfter(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isAfter(str, options.date);
			return makeResult(result, 'isAfter', i18n.__('Date should be date after %s.'), options, [
				options.date
			]);
		},

		isBefore(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isBefore(str, options.date);
			return makeResult(result, 'isBefore', i18n.__('Date should be date before %s.'), options, [
				options.date
			]);
		},

		isIn(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isIn(str, options.values);
			return makeResult(result, 'isIn', i18n.__('String is not in a list of allowed values.'), options);
		},

		isCreditCard(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isCreditCard(str);
			return makeResult(result, 'isCreditCard', i18n.__('String should be a valid credit card number.'), options);
		},

		isISBN(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isISBN(str, options.version);
			return makeResult(result, 'isISBN', i18n.__('String should be a valid ISBN'), options);
		},

		isMobilePhone(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isMobilePhone(str, options.locale);
			return makeResult(result, 'isMobilePhone', i18n.__('String should be a valid phone number.'), options);
		},

		isJSON(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isJSON(str);
			return makeResult(result, 'isJSON', i18n.__('String should be a valid JSON.'), options);
		},

		isMultibyte(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isMultibyte(str);
			return makeResult(result, 'isMultibyte', i18n.__('String should be a multibyte.'), options);
		},

		isAscii(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isAscii(str);
			return makeResult(result, 'isAscii', i18n.__('String should contain ASCII chars only.'), options);
		},

		isFullWidth(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isFullWidth(str);
			return makeResult(result, 'isFullWidth', i18n.__('String should contain any full-width chars.'), options);
		},

		isHalfWidth(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isHalfWidth(str);
			return makeResult(result, 'isHalfWidth', i18n.__('String should contain any half-width chars.'), options);
		},

		isVariableWidth(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isVariableWidth(str);
			return makeResult(result, 'isVariableWidth', i18n.__('String should contain contain a mixture of full and half-width chars.'), options);
		},

		isSurrogatePair(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isSurrogatePair(str);
			return makeResult(result, 'isSurrogatePair', i18n.__('String should contain any surrogate pairs chars.'), options);
		},

		isMongoId(str, options) {
			if (options == null) { options = {}; }
			const result = validator.isMongoId(str);
			return makeResult(result, 'isMongoId', i18n.__('String should be a valid hex-encoded representation of a MongoDB ObjectId.'), options);
		}
	};
}