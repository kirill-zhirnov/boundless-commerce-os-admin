// - typeArea - required
module.exports = i18n => (function (value, options, key, attributes) {
	if (!options.typeArea) {
		throw new Error('You must specify typearea option!');
	}

	return options.typeArea.validate();
});