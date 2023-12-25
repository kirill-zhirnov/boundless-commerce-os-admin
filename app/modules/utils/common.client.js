const escape = require('escape-html');
const pathAlias = require('path-alias');
const _ = require('underscore');

const componentNameRegExp = /^([^\.]+)\.(.+)/i;

module.exports.extractComponentName = function (name) {
	const res = name.match(componentNameRegExp);

	if (!res) {
		throw new Error('Incorrect name. Name should be: package.fileName');
	}

	return [res[1], res[2]];
};

module.exports.createWidgetByName = function (name, options = {}) {
	let fileName, packageName, WidgetConstructor;

	const Widget = require('../widget/widget.client').default;
	// const Backbone = require('../backbone/index.client');

	if (_.isString(name)) {
		[packageName, fileName] = this.extractComponentName(name);

		WidgetConstructor = this.requireFile(`@p-${packageName}/widgets/${fileName}`);
		if (WidgetConstructor.default)
			WidgetConstructor = WidgetConstructor.default;
	} else {
		WidgetConstructor = name;
	}

	if (!_.isFunction(WidgetConstructor)) {
		throw new Error(`${name} is not a constructor!`);
	}

	if (packageName) {
		options.package = packageName;
	}

	const instance = new WidgetConstructor(options);

// && !(instance instanceof Backbone.View)
	if (!(instance instanceof Widget)) {
		throw new Error(`${fileName} must be instance of Widget or Backbone.View!`);
	}

	return instance;
};

//@ts-ignore
module.exports.requireFile = path => pathAlias(path);

module.exports.isServer = () => process.env.__IS_SERVER__;

module.exports.buildHtmlAttrsStr = function (attrs) {
	const out = [];
	for (let attr in attrs) {
		let val = attrs[attr];
		if (_.isUndefined(val)) {
			continue;
		}

		if (val === null) {
			val = '';
		}

		out.push(`${attr}="${escape(val)}"`);
	}

	return out.join(' ');
};

module.exports.constructFormByEl = function ($form, returnInstanceIfExists) {
	if (returnInstanceIfExists == null) {
		returnInstanceIfExists = true;
	}
	const path = $form.data('form') || '@modules/widget/form.@c';

	return this.createWidgetByEl($form, path, returnInstanceIfExists);
};

module.exports.constructFormsGroupByEl = function ($group, returnInstanceIfExists) {
	if (returnInstanceIfExists == null) {
		returnInstanceIfExists = true;
	}
	const path = $group.data('widget-path') || '@modules/widget/formsGroup.@c';

	return this.createWidgetByEl($group, path, returnInstanceIfExists);
};

module.exports.createWidgetByEl = function ($el, path, returnInstanceIfExists) {
	if (returnInstanceIfExists == null) {
		returnInstanceIfExists = true;
	}
	if ($el.data('widget')) {
		if (returnInstanceIfExists) {
			return $el.data('widget');
		} else {
			return false;
		}
	} else {
		let WConstructor;
		switch (path) {
			case '@modules/widget/form.@c':
				WConstructor = require('../widget/form.client');
				break;
			case '@modules/widget/formsGroup.@c':
				WConstructor = require('../widget/formsGroup.client');
				break;
			default:
				//@ts-ignore
				WConstructor = pathAlias(path);
				break;
		}

		WConstructor = WConstructor.default? WConstructor.default : WConstructor;

		const widget = this.createWidgetByName(WConstructor, {
			el: $el
		});
		//@ts-ignore
		widget.onElReady();

		return widget;
	}
};

module.exports.buildAButtonByProps = function (button) {
	const $el = $('<a href="#"></a>');

	if (button.class) {
		$el.addClass(button.class);
		if (button.attrs?.disabled) $el.addClass('disabled');
	}

	if (button.label) {
		$el.html(`<span>${button.label}</span>`);
	}

	if (button.icon) {
		$el.prepend(`<span class="${button.icon}" aria-hidden="true"></span> `);
	}

	if (button.attrs) {
		$el.attr(button.attrs);
	}

	return $el;
};

module.exports.findOption = function (options, key) {
	for (let row of Array.from(options)) {
		if (_.isArray(row[1])) {
			for (let subRow of Array.from(row[1])) {
				if (subRow[0] === key) {
					return subRow[1];
				}
			}
		} else {
			if (row[0] === key) {
				return row[1];
			}
		}
	}
};

module.exports.getOptionsKeys = function (options) {
	const out = [];
	for (let row of Array.from(options)) {
		if (_.isArray(row[1])) {
			for (let subRow of Array.from(row[1])) {
				out.push(String(subRow[0]));
			}
		} else {
			out.push(String(row[0]));
		}
	}

	return out;
};

module.exports.isCurrentMenu = function (pageUrl, menuUrl) {
	let regExp;
	if (pageUrl instanceof RegExp) {
		regExp = pageUrl;
	} else if (pageUrl && (pageUrl !== '')) {
		pageUrl = pageUrl.replace('?', '\\?');
		regExp = new RegExp(`^${pageUrl}((\\?|/|&)[^/]*)?$`, 'i');
	} else {
		return false;
	}

	return regExp.test(menuUrl);
};

module.exports.ucfirst = str => str.charAt(0).toUpperCase() + str.slice(1);

module.exports.concatUrl = function (url, str) {
	if (/\?/.test(url)) {
		url += '&' + str;
	} else {
		url += '?' + str;
	}

	return url;
};

/**
 * @param url
 * @param appendVersion
 * @param isInPublicStatic - if true, returns URL for /public/static content.
 * @returns String
 */
module.exports.getGlobalStaticUrl = function (url, appendVersion = true, isInPublicStatic = false) {
	let config;
	if (process.env.__IS_SERVER__) {
		const {wrapperRegistry} = require('../registry/server/classes/wrapper');
		config = wrapperRegistry.getConfig();
	} else {
		const clientRegistry = require('../registry/client/client.client').clientRegistry;
		config = clientRegistry.getConfig();
	}

	let prefix = config.staticAssetsHost;

	//some legacy logic:
	if (isInPublicStatic) {
		prefix += '/static';
	}

	if (appendVersion) {
		url = this.concatUrl(url, `version=${this.getVersion()}`);
	}

	return `${prefix}${url}`;
};

module.exports.getMediaUrl = function (localPath) {
	return `${this.getStaticServerPrefix()}/media/${localPath}`;
};

module.exports.getStaticContentUrl = function (url, appendVersion) {
	if (appendVersion == null) {
		appendVersion = true;
	}
	if (appendVersion) {
		url = this.concatUrl(url, `version=${this.getVersion()}`);
	}

	return `${this.getStaticServerPrefix()}/app${url}`;
};

module.exports.getStaticServerPrefix = function () {
	const {clientRegistry} = require('../registry/client/client.client');
	//@ts-ignore
	const staticConfig = clientRegistry.getConfig().staticServer;

	return `${staticConfig.protocol}://${staticConfig.host}`;
};

module.exports.getVersion = () => process.env.VERSION;

module.exports.getPriceForTpl = function (curPrice, oldPrice) {
	const out = {
		oldPrice: null,
		price: _.isArray(curPrice) ? curPrice[0] : curPrice,
		isFrom: _.isArray(curPrice) && (curPrice[0] !== curPrice[1]) ? true : false
	};


	if (oldPrice && !(_.isArray(curPrice) && !_.isArray(oldPrice))) {
		out.oldPrice = _.isArray(oldPrice) ? oldPrice[0] : oldPrice;
	}

	return out;
};

module.exports.appendStyle = url => $('head').prepend(`<link href='${url}' rel='stylesheet'>`);

if (process.env.__IS_SERVER__) {
	_.extend(this, require('./server'));
}