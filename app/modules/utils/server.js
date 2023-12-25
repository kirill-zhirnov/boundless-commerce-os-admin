// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let realRoot = null;
const path = require('path');
const fs = require('fs');
const replacePathAliasRegExp = /^\$[^/]+/i;

module.exports.optionsToArray = function(options) {
	const out = [];
	for (let key in options) {
		const val = options[key];
		out.push([key, val]);
	}

	return out;
};

module.exports.bulkOptionsToArray = function(options) {
	const out = {};
	for (let key in options) {
		const val = options[key];
		out[key] = this.optionsToArray(val);
	}

	return out;
};

module.exports.getRealRoot = function() {
	if (!realRoot) {
		realRoot = this.detectRealRoot();
	}

	return realRoot;
};

module.exports.detectRealRoot = function() {
	const dirName = __dirname.split(path.sep);

	let found = false;
	while (dirName.length > 0) {
		const folderPath = dirName.join(path.sep);
		if (fs.existsSync(`${folderPath}/package.json`)) {
			//@ts-ignore
			found = folderPath;
			break;
		}

		dirName.pop();
	}

	if (!found) {
		throw new Error('Cannot find package.json. Specify root manually.');
	}

	return found;
};

module.exports.getPathRelativeToRealRoot = function(absolutePath, cutExtension) {
	if (cutExtension == null) { cutExtension = true; }
	let out = absolutePath.replace(`${this.getRealRoot()}/`, '');

	if (cutExtension) {
		// out = out.replace(/\.[^\.]+$/i, '');
		out = out.replace(/\.[^.]+$/i, '');
	}

	return out;
};

module.exports.runFlow = async function(object, flow) {
	for (const name of flow) {
		await object[name]();
	}
};

module.exports.replaceAliasInPath = (pathStr, aliases) => pathStr = pathStr.replace(replacePathAliasRegExp, alias => {
    if (alias in aliases) {
        return aliases[alias];
    } else {
        return alias;
    }
});

module.exports.clearRequireCacheByPath = function(filePath) {
	if (filePath in require.cache) {
		delete require.cache[filePath];
	}

};

module.exports.splitArr = (arr, maxItems) => arr.reduce(function(out, curVal) {
    if (!out[out.length - 1] || (out[out.length - 1].length >= maxItems)) {
        out.push([]);
    }

    out[out.length - 1].push(curVal);

    return out;
}
, []);

module.exports.convertSqlArrAgg2Objects = function(value) {
	if (!value) {
		return value;
	}

	const out = [];
	for (const [key, valuesList] of Object.entries(value)) {
		for (let i = 0; i < valuesList.length; i++) {
			if (!(i in out)) {
				out.push({});
			}

			const obj = out[i];
			obj[key] = valuesList[i];
		}
	}

	return out;
};