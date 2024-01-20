// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const JadeCompiler = require('jade/lib/compiler');
const Code = require('jade/lib/nodes/code');
// const Text = require('jade/lib/nodes/text');
// const fs = require('fs');
// const pathAlias = require('path-alias');

// import {wrapperRegistry} from '../registry/server/classes/wrapper';

// const vueCompiler = require('vue-template-compiler');

const util = require('util');
const _ = require('underscore');

const editModeVar = '__editMode';
const tagEditAttrsVar = '__attrs';

const Compiler = function () {
	return JadeCompiler.apply(this, arguments);
};

util.inherits(Compiler, JadeCompiler);

Compiler.prototype.visitTag = function (tag) {
	if (['v:container', 'v:block', 'v:section'].indexOf(tag.name) !== -1) {
		//@ts-ignore
		this.buf.push(`var ${tagEditAttrsVar} = {};`);
	}

	switch (tag.name) {
		case 'v:container':
			return this.visitVContainer(tag);

		case 'v:block':
			return this.visitVBlock(tag);

		case 'v:section':
			return this.visitVSection(tag);

		// case 'vue-component':
		// 	return this.visitVueComponent(tag);

		// case 'vue-template':
		// 	return this.visitVueTemplate(tag);

		default:
			//@ts-ignore
			return Compiler.super_.prototype.visitTag.apply(this, arguments);
	}
};

Compiler.prototype.visitVSection = function (tag) {
	const vAttrs = _.defaults(this.extractVBlockAttrs(tag), {
		boss: '@p-theme/bosses/section.@c'
	});

	const editableAttrs = {
		'data-edit': 'section',
		'data-boss': vAttrs.boss,
		'class': 'editable-section'
	};

//	if vAttrs.visible is false
//		editableAttrs['data-visible'] = false
//		editableAttrs['class'] += " editable-container-hidden"

	this.addAttrs(tag, editableAttrs, 'ifEditMode');
	this.omitEditableTag(tag, ['boss', 'boss-buttons', 'visible']);

	tag.name = 'section';

	this.visitIfVisible('Tag', tag, vAttrs.visible);

};

// Compiler.prototype.visitVueTemplate = function(tag) {
// 	tag.name = 'script';
//
// 	const tagAttrs = this.extractVBlockAttrs(tag, ['tpl']);
// 	if (!tagAttrs.tpl) {
// 		throw new Error('No vue attribute for vue-component node!');
// 	}
// 	this.rmAttrs(tag, ['tpl']);
//
// 	this.compileVueTpl(tag, tagAttrs.tpl);
//
// 	return this.visitTag(tag);
// };

// Compiler.prototype.visitVueComponent = function(tag) {
// 	tag.name = 'script';
//
// 	const tagAttrs = this.extractVBlockAttrs(tag, ['tpl', 'name', 'path']);
// 	if (!tagAttrs.tpl || !tagAttrs.name || !tagAttrs.path) {
// 		throw new Error('No vue attribute for vue-component node!');
// 	}
//
// 	this.addAttrsToTag(tag, {
// 		'id': `tpl-${tagAttrs.name}`,
// 		'data-vue-name': tagAttrs.name,
// 		'data-path': tagAttrs.path
// 	});
// 	this.rmAttrs(tag, ['name', 'path', 'tpl']);
//
// 	this.compileVueTpl(tag, tagAttrs.tpl);
//
// 	return this.visitTag(tag);
// };

// Compiler.prototype.compileVueTpl = function(tag, tplAttrVal) {
// 	let text, typeAttr;
// 	const tplPath = fs.realpathSync(pathAlias.resolve(tplAttrVal));
//
// 	if (!/\.html$/.test(tplPath)) {
// 		throw new Error(`Path '${tplPath}' is not a html file.`);
// 	}
//
// 	const htmlTpl = fs.readFileSync(tplPath, {encoding: 'utf8'});
//
// 	const {preCompileVue} = wrapperRegistry.getConfig().viewRenderer;
//
// 	if (preCompileVue) {
// 		const res = vueCompiler.compile(htmlTpl);
// 		text = new Text(JSON.stringify(_.pick(res, ['render', 'staticRenderFns'])));
// 		typeAttr = 'text/x-compiled';
// 	} else {
// 		text = new Text(htmlTpl);
// 		typeAttr = 'text/x-template';
// 	}
//
// 	this.addAttrToTag(tag, 'type', typeAttr);
//
// 	return tag.block.nodes.push(text);
// };

Compiler.prototype.rmAttrs = (tag, attrs) => (() => {
	const result = [];
	for (var attr of Array.from(attrs)) {
		if (Array.isArray(tag.attributeNames)) {
			tag.attributeNames = tag.attributeNames.filter(function (el) {
				if (el === attr) {
					return false;
				}

				return true;
			});
		}

		if (Array.isArray(tag.attrs)) {
			result.push(tag.attrs = tag.attrs.filter(function (attrObj, i) {
				if (attrObj.name === attr) {
					return false;
				}

				return true;
			}));
		} else {
			result.push(undefined);
		}
	}
	return result;
})();

Compiler.prototype.addAttrsToTag = function (tag, attrs) {
	return (() => {
		const result = [];
		for (let attrName in attrs) {
			const attrVal = attrs[attrName];
			result.push(this.addAttrToTag(tag, attrName, attrVal));
		}
		return result;
	})();
};

Compiler.prototype.addAttrToTag = function (tag, attrName, attrVal) {
	tag.attrs.push({
		name: attrName,
		val: JSON.stringify(attrVal),
		escaped: true
	});
	return tag.attributeNames.push(attrName);
};

Compiler.prototype.visitVBlock = function (tag) {
	const vAttrs = this.extractVBlockAttrs(tag);

	// attrbutes which will be added to a node IF ONLY editMode = TRUE
	const editableAttrs = {
		'data-edit': 'block',
		'class': []
	};

	const defaultBosses = {
		logo: '@p-theme/bosses/logo.@c',
		hr: '@p-theme/bosses/boss.@c',
		text: '@p-theme/bosses/text.@c',
		simpleText: '@p-theme/bosses/simpleText.@c',
		widget: 'widget',
		header: '@p-theme/bosses/header.@c',
		iconWithLink: '@p-theme/bosses/iconWithLink.@c',
		itemsSwiper: '@p-theme/bosses/itemsSwiper.@c',
		swiperSlider: '@p-theme/bosses/swiperSlider.@c'
	};

	if (!vAttrs.boss && vAttrs.type in defaultBosses) {
		vAttrs.boss = defaultBosses[vAttrs.type];
	}

	if (vAttrs.boss) {
		editableAttrs['data-boss'] = vAttrs.boss;
	}

	if (vAttrs['boss-buttons']) {
		editableAttrs['data-boss-buttons'] = vAttrs['boss-buttons'];
	}

	if (vAttrs.visible === false) {
		editableAttrs['class'].push('editable-block-hidden');
		editableAttrs['data-visible'] = false;
	}

	if (this.isTypeWidgetBased(vAttrs.type)) {
		let widgetInit;
		let widgetParams = [`incomeAttrs:${tagEditAttrsVar}`];

		// since vAttrs and editableAttrs are objects - it is passed by references
		// no need to set a result back to vAttrs and editableAttrs
		this.prepareBlockWidgetAttrs(vAttrs, editableAttrs, widgetParams);

		if (vAttrs.id) {
			widgetParams.push(`id:"${vAttrs.id}"`);
		}

		const widgetClasses = [];
		if (_.isArray(tag.attrs)) {
			for (let attr of Array.from(tag.attrs)) {
				if (attr.name === 'class') {
					widgetClasses.push(this.getAttrVal(attr));
				}
			}
		}

		widgetParams.push(`className:"${widgetClasses.join(' ')}"`);
		//@ts-ignore
		widgetParams = `{${widgetParams.join(',')}}`;

		if (_.size(tag.attributeBlocks) === 1) {
			widgetInit = `_.extend(${tag.attributeBlocks[0]}, ${widgetParams})`;
		} else if (_.size(tag.attributeBlocks) === 0) {
			widgetInit = `'${widgetParams}'`;
		} else {
			throw new Error('Amount of attributes, which passed in &attributes() to widget can be only one!');
		}

		this.addAttrs(tag, editableAttrs, 'ifEditMode');

		const code = new Code(`widget('${vAttrs.widget}', ${widgetInit})`, true, false);

		this.visitIfVisible('Code', code, vAttrs.visible);
	} else {
		let editableClass = 'editable-block';
		switch (vAttrs.type) {
			case 'logo':
				this.rmAttrs(tag, ['size']);
				break;

			case 'text':
				var additionalAttrs = this.extractVBlockAttrs(tag, ['tpl']);

//				if it doesn't work it might be quickly switched back to bosses/text.@c
				if (additionalAttrs.tpl === 'text') {
					editableClass = 'editable-block-outlined';
					editableAttrs['data-boss'] = '@p-theme/bosses/inlineText.@c';
				}
				break;
		}

		editableAttrs.class.push(vAttrs['edit-class'] || editableClass);

		this.addAttrs(tag, editableAttrs, 'ifEditMode');
		this.omitEditableTag(tag, ['type', 'init', 'widget', 'boss-buttons', 'boss', 'tpl', 'visible', 'edit-class']);

		this.setTagNameByType(tag, vAttrs.type);

		this.visitIfVisible('Tag', tag, vAttrs.visible);
	}

};

Compiler.prototype.setTagNameByType = function (tag, type) {
	switch (type) {
		case 'hr':
			tag.name = 'hr';
			return tag.selfClosing = true;
	}
};


Compiler.prototype.prepareBlockWidgetAttrs = function (vAttrs, editableAttrs, widgetParams) {
	let editableClass = 'editable-block';
	let defaultWidget = null;

	switch (vAttrs.type) {
		case 'products':
			editableClass = 'editable-products-block';
			defaultWidget = 'catalog.productsList.@c';
			break;

		case 'imgsCombinations':
			defaultWidget = 'cms.imgsCombinations.@c';
			break;

		case 'carousel':
			editableClass = 'editable-carousel-block';
			defaultWidget = 'cms.carousel.@c';
			break;

		case 'externalWidget':
			defaultWidget = 'cms.externalWidget.@c';
			break;

		case 'textWithIcons':
			defaultWidget = 'cms.textWithIcons.@c';
			break;

		case 'socialButtons':
			defaultWidget = 'cms.socialButtons.@c';
			break;

		case 'vkWidget':
			defaultWidget = 'cms.vkWidget.@c';
			break;

		case 'map':
			defaultWidget = 'cms.map.@c';
			break;

		case 'cover':
			defaultWidget = 'cms.cover.@c';
			break;

		case 'blog':
			editableClass = 'editable-block-outlined';
			defaultWidget = 'cms.blog.@c';
			break;

		case 'form':
			defaultWidget = 'cms.customForm.@c';
			break;

		case 'review':
			defaultWidget = 'cms.review.@c';
			break;

		case 'menu':
			console.log('--- there !');
			defaultWidget = 'cms.menu.@c';
			if (vAttrs['menu-key'] !== undefined) {
				widgetParams.push('menuKey:"' + vAttrs['menu-key'] + '"');
			}
			break;

		case 'iconWithLink':
			defaultWidget = 'cms.iconWithLink.@c';
			break;

		case 'itemsSwiper':
			editableClass = 'editable-block-outlined';
			defaultWidget = 'cms.itemsSwiper.@c';
			break;

		case 'swiperSlider':
			editableClass = 'editable-block-outlined';
			defaultWidget = 'cms.swiperSlider.@c';
			break;

		case 'imgsTiger':
			editableClass = 'editable-block-outlined';
			defaultWidget = 'cms.imgsTiger.@c';
			break;

		case 'bobcatGallery':
			defaultWidget = 'cms.bobcatGallery.@c';
			break;

		case 'elephantMenu':
			defaultWidget = 'cms.elephantMenu.@c';
			break;

		case 'flexHeader':
			defaultWidget = 'cms.flexHeader.@c';
			break;

		default:
			editableClass = null;
			editableAttrs.class.push(vAttrs['edit-class'] || 'editable-block-outlined');
	}

	if (editableClass) {
		editableAttrs.class.push(editableClass);
	}

	if (defaultWidget && !vAttrs.widget) {
		vAttrs.widget = defaultWidget;
	}

	if (defaultWidget && !editableAttrs['data-boss']) {
		return editableAttrs['data-boss'] = 'widget';
	}
};

Compiler.prototype.isTypeWidgetBased = type => [
	'widget', 'carousel', 'externalWidget', 'products',
	'textWithIcons', 'vkWidget', 'map', 'socialButtons',
	'cover', 'blog', 'form', 'imgsCombinations', 'review',
	'menu', 'iconWithLink', 'itemsSwiper', 'swiperSlider',
	'imgsTiger', 'bobcatGallery', 'elephantMenu',
	'flexHeader'
].indexOf(type) !== -1;

Compiler.prototype.visitVContainer = function (tag) {
	const vAttrs = _.defaults(this.extractVBlockAttrs(tag), {
		boss: '@p-theme/bosses/container.@c',
		type: 'container',
		'is-main': 'true'
	});

	const editableAttrs = {
		'data-type': vAttrs.type,
		'data-edit': 'container',
		'data-boss': vAttrs.boss,
		'data-is-main': vAttrs['is-main'] === 'true' ? true : false,
		'class': 'editable-container'
	};

	if (vAttrs.visible === false) {
		editableAttrs['data-visible'] = false;
		editableAttrs['class'] += ' editable-container-hidden';
	}

	this.addAttrs(tag, editableAttrs, 'ifEditMode');
	this.omitEditableTag(tag, ['boss', 'boss-buttons', 'visible', 'type', 'is-main']);

	this.visitIfVisible('Tag', tag, vAttrs.visible);

};

Compiler.prototype.visitIfVisible = function (suffix, tag, isVisible) {
	if (isVisible === false) {
		//@ts-ignore
		this.buf.push(`if (${editModeVar}) {`);
	}

	this[`visit${suffix}`](tag);

	if (isVisible === false) {
		//@ts-ignore
		return this.buf.push('}');
	}
};

Compiler.prototype.addAttrs = function (tag, attrs, condition) {
	if (attrs == null) {
		attrs = {};
	}
	if (condition == null) {
		condition = 'ifEditMode';
	}
	switch (condition) {
		case 'ifEditMode':
			//@ts-ignore
			this.buf.push(`if (${editModeVar}) {`);
			break;

		default:
			throw new Error(`Unknown condition: '${condition}'`);
	}

	for (let key in attrs) {
		let val = attrs[key];
		if (_.isArray(val)) {
			val = val.join(' ');
		}

		//@ts-ignore
		this.buf.push(`${tagEditAttrsVar}['${key}'] = '${val}';`);
	}

	//@ts-ignore
	this.buf.push('}');

	if (!_.isArray(tag.attributeBlocks) || (tag.attributeBlocks.indexOf(tagEditAttrsVar) === -1)) {
		return tag.attributeBlocks.push(tagEditAttrsVar);
	}
};

Compiler.prototype.omitEditableTag = function (tag, omitAttrs) {
	if (omitAttrs == null) {
		omitAttrs = [];
	}
	let tagName = 'div';
	const tagAttrs = [];
	const tagAttrNames = [];

	for (let i = 0; i < tag.attrs.length; i++) {
		const attr = tag.attrs[i];
		switch (attr.name) {
			case 'tag':
				tagName = this.getAttrVal(attr);
				break;
			default:
				if (_.indexOf(omitAttrs, attr.name) === -1) {
					tagAttrs.push(attr);
					tagAttrNames.push(attr.name);
				}
		}
	}


	tag.name = tagName;
	tag.attributeNames = tagAttrNames;
	return tag.attrs = tagAttrs;
};

Compiler.prototype.getAttrVal = function (attr) {
	if (attr.escaped) {
		return JSON.parse(attr.val);
	}

	return attr.val;
};

Compiler.prototype.extractVBlockAttrs = function (tag, needAtts = null) {
	if (!needAtts) {
		needAtts = ['type', 'widget', 'boss', 'visible', 'boss-buttons', 'id', 'edit-class', 'is-main', 'menu-key'];
	}

	const out = {};
	for (let attrKey of Array.from(needAtts)) {
		out[attrKey] = undefined;
	}

	if (_.isArray(tag.attrs)) {
		for (let attr of Array.from(tag.attrs)) {
			if (attr.name in out) {
				out[attr.name] = this.getAttrVal(attr);

				switch (attr.name) {
					case 'visible':
						out.visible = (out.visible === 'false') || (out.visible === '0') ? false : true;
						break;
				}
			}
		}
	}

	return out;
};

module.exports = Compiler;