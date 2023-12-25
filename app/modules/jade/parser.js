// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const JadeParser = require('jade/lib/parser');
const util = require('util');
const pathAlias = require('path-alias');
const babylonUtils = require('../utils/server');
const path = require('path');
const _ = require('underscore');

const Parser = function() {
	return JadeParser.apply(this, arguments);
};

util.inherits(Parser, JadeParser);

Parser.prototype.resolvePath = function(pathStr, purpose) {
	let resolvedPath;
	//@ts-ignore
	if (!Array.isArray(this.options.allowedPaths)) {
		throw new Error('You must specify allowedPaths!');
	}

	//@ts-ignore
	if ((pathStr[0] === '$') && (this.options.pathAliases != null)) {
		//@ts-ignore
		pathStr = babylonUtils.replaceAliasInPath(pathStr, this.options.pathAliases);

		if (path.basename(pathStr).indexOf('.') === -1) {
			pathStr += '.jade';
		}

		resolvedPath = path.resolve(pathStr);
	} else {
		//@ts-ignore
		resolvedPath = Parser.super_.prototype.resolvePath.apply(this, arguments);
	}

//	!wrapperConfig.debug &&
	if (!this.checkPathAccess(resolvedPath) || !_.contains(['include', 'extends'], purpose)) {
		throw new Error('ENOENT: Invalid path or purpose');
	}

	return resolvedPath;
};

module.exports = Parser;

Parser.prototype.checkPathAccess = function(resolvedPath) {
	let isAllowed = false;

	const appFolder = `${pathAlias.getRoot()}/app`;
	const viewsRegExp = new RegExp(`^${escapeRegExp(appFolder)}\/views`);
	const packageRegExp = new RegExp(`^${escapeRegExp(appFolder)}\/packages\/[A-z]+\/(views|widgets\/views|notifications\/views)\/.+.jade$`);

	if (viewsRegExp.test(resolvedPath) || packageRegExp.test(resolvedPath)) {
		isAllowed = true;
	} else {
		//@ts-ignore
		for (let allowedPath of Array.from(this.options.allowedPaths)) {
			const regExp = new RegExp(`^${escapeRegExp(allowedPath)}`);

			if (regExp.test(resolvedPath)) {
				isAllowed = true;
				break;
			}
		}
	}

	return isAllowed;
};

var escapeRegExp = str => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
