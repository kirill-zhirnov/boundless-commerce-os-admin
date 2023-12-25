module.exports = function (value) {
	if ((typeof (value) === 'undefined') || (value === null)) {
		return '';
	}

	return String(value);
};