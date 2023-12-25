const escape = require('escape-html');
const utils = require('../utils/common.client');
const _ = require('underscore');

// The idea of HTML generator was taken from http://www.yiiframework.com/doc/api/1.1/CHtml

const nameBraketsRegExp = /\[\]$/i;

module.exports.closeSingleTags = true;

// Special attributes are recognized:
// - select - the selected value
module.exports.dropDownList = function(name, data, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	if (!_.isObject(htmlOptions)) {
		htmlOptions = {};
	}

	htmlOptions.name = name;

	const options = this.listOptions(htmlOptions.select, data);

	return this.tag('select', _.omit(htmlOptions, ['select']), options);
};

module.exports.listOptions = function(selection, options, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	let out = '';

	if (!_.isArray(options)) {
		return  out;
	}

	for (let option of Array.from(options)) {
		out += this.option(selection, option, htmlOptions);
	}

	return out;
};

module.exports.option = function(selection, option, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	const attrs = _.extend({}, htmlOptions);

//	optgroup
	if (_.isArray(option[1])) {
		attrs.label = option[0];

		let subOptions = '';
		for (let item of Array.from(option[1])) {
			subOptions += this.option(selection, item, htmlOptions);
		}

		return this.tag('optgroup', attrs, subOptions);
	} else {
		attrs.value = option[0];

// 		selection could be a string and option[0] - a number
		if ((_.isArray(selection) && (selection.indexOf(option[0]) !== -1)) || (String(option[0]) === String(selection))) {
			attrs.selected = 'selected';
		}

//		out += @tag 'option', attrs, escape(option[1])
		return this.tag('option', attrs, option[1]);
	}
};

module.exports.label = function(label, forAttr, htmlOptions = {}) {
	if (forAttr !== false) {
		htmlOptions.for = forAttr;
	}

	return this.tag('label', htmlOptions, label);
};

module.exports.radioButton = function(name, checked, htmlOptions) {
	if (checked == null) { checked = false; }
	if (htmlOptions == null) { htmlOptions = {}; }
	if (checked) {
		htmlOptions.checked = 'checked';
	} else {
		delete htmlOptions.checked;
	}

	this.appendAttr('class', 'form-check-input', htmlOptions);

	const value = _.isUndefined(htmlOptions.value) ? '1' : htmlOptions.value;

	return this.inputField('radio', name, value, htmlOptions);
};


// Special attributes are recognized:
// - select - the selected value
// - template - default to: {beginLabel}{input}{title}{/endLabel}
// - separator - defaults to null
// - inputOptions - htmlOptions for <input>
// - labelOptions - htmlOptions for <label>
module.exports.radioButtonList = function(name, data, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	htmlOptions = _.extend({
		select : null,
		template : '{beginLabel}{input} {title}{/endLabel}',
		separator : '',
		inputOptions : {},
		labelOptions : {}
	}, htmlOptions);

	const out = [];
	for (let option of Array.from(data)) {
		const value = option[0];
		const title = option[1];

		const inputOptions = _.extend({
			type : 'radio',
			name,
			value
		}, htmlOptions.inputOptions);

		if (value === htmlOptions.select) {
			inputOptions.checked = 'checked';
		}

		let labelAttrs = utils.buildHtmlAttrsStr(htmlOptions.labelOptions);
		if (labelAttrs !== '') {
			labelAttrs = ` ${labelAttrs}`;
		}

		const replacements = {
			'{beginLabel}' : `<label${labelAttrs}>`,
			'{input}' : this.tag('input', inputOptions, false, false),
			'{title}' : escape(title),
			'{/endLabel}' : '</label>'
		};

		let row = htmlOptions.template;
		for (let from in replacements) {
			const to = replacements[from];
			row = row.replace(from, to);
		}

		out.push(row);
	}

	return out.join(htmlOptions.separator);
};

// Special attributes are recognized:
// - select - Array/String - checked value
// - template - default to: {beginLabel}{input}{title}{/endLabel}
// - separator - defaults to null
// - inputOptions - htmlOptions for <input>
// - labelOptions - htmlOptions for <label>
module.exports.checkboxList = function(name, data, htmlOptions) {
	if (htmlOptions == null) { htmlOptions = {}; }
	if (!nameBraketsRegExp.test(name)) {
		name += '[]';
	}

	htmlOptions = _.extend({
		select : null,
		template : '{beginLabel}{input} {title}{/endLabel}',
		separator : '',
		inputOptions : {},
		labelOptions : {}
	}, htmlOptions);

	const out = [];
	for (let option of Array.from(data)) {
		const value = option[0];
		const title = option[1];

		const inputOptions = _.extend({
			type : 'checkbox',
			name,
			value
		}, htmlOptions.inputOptions);

		if (_.isArray(htmlOptions.select)) {
			if (_.indexOf(htmlOptions.select, value) !== -1) {
				inputOptions.checked = 'checked';
			}
		} else {
			if (value === htmlOptions.select) {
				inputOptions.checked = 'checked';
			}
		}

		let labelAttrs = utils.buildHtmlAttrsStr(htmlOptions.labelOptions);
		if (labelAttrs !== '') {
			labelAttrs = ` ${labelAttrs}`;
		}

		const replacements = {
			'{beginLabel}' : `<label${labelAttrs}>`,
			'{input}' : this.tag('input', inputOptions, false, false),
			'{title}' : escape(title),
			'{/endLabel}' : '</label>'
		};

		let row = htmlOptions.template;
		for (let from in replacements) {
			const to = replacements[from];
			row = row.replace(from, to);
		}

		out.push(row);
	}

	return out.join(htmlOptions.separator);
};

module.exports.password = function(name, value = '', htmlOptions = {}) {
	return this.inputField('password', name, value, htmlOptions);
};

module.exports.textField = function(name, value, htmlOptions) {
	if (value == null) { value = ''; }
	if (htmlOptions == null) { htmlOptions = {}; }
	return this.inputField('text', name, value, htmlOptions);
};

module.exports.hiddenField = function(name, value = '', htmlOptions = {}) {
	return this.inputField('hidden', name, value, htmlOptions);
};

module.exports.inputField = function(type, name, value, htmlOptions = {}) {
	const options = _.extend({
		type,
		name,
		value
	}, htmlOptions);

	return this.tag('input', options, false, false);
};

module.exports.textArea = function(name, value = '', htmlOptions = {}) {
	const options = _.extend({
		name
	}, htmlOptions);

	if (options.value) {
		({value} = options);
		delete options.value;
	}

	if (value === null) {
		value = '';
	}

	if (options.encode !== false) {
		value = escape(value);
	}

	return this.tag('textarea', options, value);
};

module.exports.img = function(htmlOptions = {}, skipSize = false) {
	if (skipSize) {
		htmlOptions = _.omit(htmlOptions, ['width', 'height']);
	}

	return this.tag('img', htmlOptions, false, false);
};

module.exports.tag = function(tag, htmlOptions, content, closeTag) {
	if (htmlOptions == null) { htmlOptions = {}; }
	if (content == null) { content = false; }
	if (closeTag == null) { closeTag = true; }
	let htmlAttrs = utils.buildHtmlAttrsStr(htmlOptions);

	if (htmlAttrs !== '') {
		htmlAttrs = ` ${htmlAttrs}`;
	}

	const html = `<${tag}${htmlAttrs}`;

	if (content === false) {
		if (closeTag && this.closeSingleTags) { return `${html}/>`; } else { return `${html}>`; }
	} else {
		if (closeTag) { return `${html}>${content}</${tag}>`; } else { return `${html}>${content}`; }
	}
};

// Generates hidden input with primary key
module.exports.pk = function(value, name = 'pk', attrs = {class: 'pk'}) {
	const out = [];

//	Generate PK only if it has value
	if (value) {
		if (_.isObject(value)) {
			for (let key in value) {
				const val = value[key];
				const inputName = `${name}[${key}]`;
				out.push(this.hiddenField(inputName, val, attrs));
			}
		} else {
			out.push(this.hiddenField(name, value, attrs));
		}
	}

	return out.join('');
};

module.exports.checkbox = function(name, checked = false, htmlOptions = {}) {
	_.defaults(htmlOptions, {
		value : 1
	});

	this.appendAttr('class', 'form-check-input', htmlOptions);
	if (checked) {
		htmlOptions.checked = 'checked';
	}

	return this.inputField('checkbox', name, htmlOptions.value, htmlOptions);
};

module.exports.nl2br = function(str) {
	if ((str == null)) {
		str = '';
	}

	str = String(str);

	return str.replace(/([^>])\n/g, '$1<br/>');
};

module.exports.escape = value => escape(value);

module.exports.noImg = function(width, height, htmlOptions = {}) {
	_.defaults(htmlOptions, {
		class: 'no-image',
		style: `width:${width}px; height:${height}px;`
	});

	return this.tag('div', htmlOptions);
};

module.exports.link = function(text, url, htmlOptions) {
	if (url == null) { url = '#'; }
	if (htmlOptions == null) { htmlOptions = {}; }
	_.defaults(htmlOptions, {
		href : url
	});

	return this.tag('a', htmlOptions, text);
};

module.exports.faIcon = function(icon, htmlOptions = {}) {
	this.appendAttr('class', `fa fa-${icon}`, htmlOptions);

	_.defaults(htmlOptions, {
		'aria-hidden' : 'true'
	});

	return this.tag('i', htmlOptions, '');
};

module.exports.appendAttr = function(attr, value, options) {
	if (options == null) { options = {}; }
	if (!(attr in options)) {
		options[attr] = '';
	}

	if (options[attr] !== '') {
		options[attr] += ' ';
	}

	options[attr] += value;

	return options;
};