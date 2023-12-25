const toString = require('../../validator/toString');

// Available options:
// - pk required
// - row || null
module.exports = i18n => (function (value, options, key, attributes) {
	value = toString(value);
	let pk = null;
	if (options.row) {
		pk = options.row[options.pk];
	}

	if ((value === '') || !pk) {
		return true;
	}

	value = parseInt(value);
	pk = parseInt(pk);

	if (value === pk) {
		return {
			code: 'treeError',
			message: i18n.__('Parent cannot point to itself')
		};
	}
});
