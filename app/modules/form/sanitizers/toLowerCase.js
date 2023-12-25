module.exports = i18n => (function (value, options, key, attributes, form) {
	if ((typeof (value) === 'undefined') || (value === null)) {
		return '';
	}

	return String(value).toLowerCase();
});