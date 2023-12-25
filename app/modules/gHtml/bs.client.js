const active = require('./active.client');
const gHtml = require('./index.client');
const _ = require('underscore');

module.exports.label = function(label, forAttr, htmlOptions = {}) {
	gHtml.appendAttr('class', 'form-label control-label', htmlOptions);
	return gHtml.label(label, forAttr, htmlOptions);
};

module.exports.textField = function(row, field, htmlOptions = {}) {
	gHtml.appendAttr('class', 'form-control', htmlOptions);
	return active.textField(row, field, htmlOptions);
};

module.exports.password = function(row, field, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	gHtml.appendAttr('class', 'form-control', htmlOptions);
	return active.password(row, field, htmlOptions);
};

module.exports.dropDownList = function(row, field, data, firstOption = [], htmlOptions = {}) {
	gHtml.appendAttr('class', 'form-select', htmlOptions);
	return active.dropDownList(row, field, data, firstOption, htmlOptions);
};

module.exports.radioButtonList = function(row, field, data, htmlOptions = {}) {
	htmlOptions.template = '<div class="radio form-check">{beginLabel}{input} {title}{/endLabel}</div>';

	htmlOptions.labelOptions = htmlOptions.labelOptions || {};
	htmlOptions.inputOptions =  htmlOptions.inputOptions || {};

	htmlOptions.labelOptions = _.defaults(htmlOptions.labelOptions, {
		class : 'form-check-label'
	});

	htmlOptions.inputOptions = _.defaults(htmlOptions.inputOptions, {
		class : 'form-check-input'
	});

	return active.radioButtonList(row, field, data, htmlOptions);
};

module.exports.radioButtonListInline = function(row, field, data, htmlOptions = {}) {
	htmlOptions.template = '<div class="radio form-check form-check-inline">{beginLabel}{input} {title}{/endLabel}</div>';

	htmlOptions.labelOptions = htmlOptions.labelOptions || {};
	htmlOptions.inputOptions =  htmlOptions.inputOptions || {};

	htmlOptions.labelOptions = _.defaults(htmlOptions.labelOptions, {
		class : 'radio-inline form-check-label'
	});

	htmlOptions.inputOptions = _.defaults(htmlOptions.inputOptions, {
		class : 'form-check-input'
	});

	return active.radioButtonList(row, field, data, htmlOptions);
};

module.exports.checkboxList = function(row, field, data, htmlOptions = {}) {
	htmlOptions.template = '<div class="checkbox form-check">{beginLabel}{input} {title}{/endLabel}</div>';

	htmlOptions.labelOptions = htmlOptions.labelOptions || {};
	htmlOptions.inputOptions =  htmlOptions.inputOptions || {};

	htmlOptions.labelOptions = _.defaults(htmlOptions.labelOptions, {
		class : 'form-check-label'
	});

	htmlOptions.inputOptions = _.defaults(htmlOptions.inputOptions, {
		class : 'form-check-input'
	});

	return active.checkboxList(row, field, data, htmlOptions);
};


module.exports.inlineRadioButtonList = function(row, field, data, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	htmlOptions.labelOptions = gHtml.appendAttr('class', 'radio-inline', htmlOptions.labelOptions || {});

	return active.radioButtonList(row, field, data, htmlOptions);
};

module.exports.textArea = function(row, field, htmlOptions = {}) {
	gHtml.appendAttr('class', 'form-control', htmlOptions);
	_.defaults(htmlOptions, {
		rows : 3
	});

	return active.textArea(row, field, htmlOptions);
};

module.exports.value = function(row, field, data = null) {
	let value = active.value(row, field, data);

	if ((value == null)) {
		value = '';
	}

	return gHtml.tag('input', {class : 'form-control-plaintext', readonly: '', value});
};

module.exports.alert = function(type, text, htmlOptions = {}) {
	gHtml.appendAttr('class', `alert alert-${type}`, htmlOptions);

	_.defaults(htmlOptions, {
		role: 'alert'
	});

	return gHtml.tag('div', htmlOptions, text);
};

module.exports.icon = function(icon, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	gHtml.appendAttr('class', `glyphicon glyphicon-${icon}`, htmlOptions);

	_.defaults(htmlOptions, {
		'aria-hidden' : 'true'
	});

	return gHtml.tag('span', htmlOptions, '');
};

module.exports.closeIcon = function(htmlOptions = {}) {
	_.defaults(htmlOptions, {
		type: 'button',
		class: 'btn-close',
		'aria-label': 'Close',
		content: ''
	});

	return gHtml.tag('button', htmlOptions, htmlOptions.content, true);
};