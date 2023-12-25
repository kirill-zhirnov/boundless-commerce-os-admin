// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const _ = require('underscore');
const Widget = pathAlias('@widget');
const Backbone = pathAlias('@bb');
const serializer = pathAlias('@modules/serializer.@c');

class Importer {

//	UnSerialize widgets by data and init widgets.
	import(data) {
		return (() => {
			const result = [];
			for (var type in data) {
				var dataList = data[type];
				result.push((() => {
					const result1 = [];
					for (let id in dataList) {
						const props = dataList[id];
						const instance = serializer.unSerialize(props);

						switch (type) {
							case "widget":
								result1.push(instance.afterCSExport());
								break;
							case "model": case "collection":
								break;
							default:
								throw new Error(`Constructor '${type}'-'${id}' has incorrect type`);
						}
					}
					return result1;
				})());
			}
			return result;
		})();
	}
}

module.exports = Importer;