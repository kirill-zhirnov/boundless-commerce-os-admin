const _ = require('underscore');
const gHtml = require('./index.client');
const Jed = require('../i18n/jed.client').default;

module.exports.textField = function (row, field, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend(this.defaultAttrs(row, field), htmlOptions);

	return gHtml.textField(field, row[field], options);
};

module.exports.password = function (row, field, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend(this.defaultAttrs(row, field), htmlOptions);

	return gHtml.password(field, row[field], options);
};


module.exports.hiddenField = function (row, field, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend(this.defaultAttrs(row, field), htmlOptions);

	return gHtml.hiddenField(field, row[field], options);
};

module.exports.dropDownList = function (row, field, data, firstOption = [], htmlOptions = {}) {
	if (firstOption instanceof Jed) {
		firstOption = ['', firstOption.__('Select')];
	}

	if (Array.isArray(firstOption) && (firstOption.length > 0)) {
		data = [firstOption].concat(data);
	}

	const options = _.extend(this.defaultAttrs(row, field), {
		select: row[field]
	}, htmlOptions);

	return gHtml.dropDownList(field, data, options);
};

module.exports.checkboxList = function (row, field, data, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend({
		select: row[field]
	}, htmlOptions);

	return gHtml.checkboxList(field, data, options);
};

module.exports.radioButtonList = function (row, field, data, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend({
		select: row[field]
	}, htmlOptions);

	return gHtml.radioButtonList(field, data, options);
};

module.exports.radioButton = function (row, field, htmlOptions) {
	if (htmlOptions == null) {
		htmlOptions = {};
	}
	const options = _.extend(this.defaultAttrs(row, field), {
		value: '1'
	}, htmlOptions);

	const checked = options.value === row[field];
	return gHtml.radioButton(field, checked, options);
};

module.exports.textArea = function (row, field, htmlOptions = {}) {
	const options = _.extend(this.defaultAttrs(row, field), htmlOptions);

	return gHtml.textArea(field, row[field], options);
};

module.exports.checkbox = function (row, field, htmlOptions = {}) {
	gHtml.appendAttr('class', 'form-check-input', htmlOptions);

	const options = _.extend(this.defaultAttrs(row, field), {
		value: '1'
	}, htmlOptions);

	let checked = String(options.value) === String(row[field]);
	if ((options.value === '1') && (row[field] === true)) {
		checked = true;
	}

	return gHtml.checkbox(field, checked, options);
};

module.exports.defaultAttrs = function (row, field) {
	const out = {
		id: field
	};

	return out;
};

// возвращает title опции dropdownList или список title разделенных запятой (например для checkbox)
module.exports.value = function (row, field, data = null, options = {}) {
	_.defaults(options, {
		separator: ', '
	});

	let value = null;

	if (data != null) {
		const out = [];
		let dbValue = row[field];
		dbValue = dbValue && _.isArray(dbValue) ? dbValue : [dbValue];

		for (let dbVal of Array.from(dbValue)) {
			for (let item of Array.from(data)) {
				if (String(item[0]) === String(dbVal)) {
					out.push(item[1]);
				}
			}
		}

		value = out.join(options.separator);
	} else {
		value = row[field];
	}

	return value;
};