// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');
const thumbnailSize = pathAlias('@p-cms/modules/thumbnail/size');

class ProductImgSize extends Form {
	getRules() {
		return [
			['size', 'required'],
			['size', 'inOptions', {options: 'size'}]
		];
	}

	save() {
		const deferred = Q.defer();

		this.getRegistry().getSettings().set('system', 'imgProportion', this.getSafeAttr('size'))
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	setup() {
		const deferred = Q.defer();

		super.setup(...arguments)
		.then(() => {
			return this.getRegistry().getSettings().get('system', 'imgProportion');
	}).then(value => {
			this.attributes.size = value;

			return deferred.resolve();
		}).done();

		return deferred.promise;
	}

	rawOptions() {
		return {
			size : this.getSizeOptions()
		};
	}

	getSizeOptions(out) {
		if (out == null) { out = []; }
		for (let val of Array.from(thumbnailSize.getImgProportions())) {
			out.push([val, val]);
		}

		return out;
	}
}

module.exports = ProductImgSize;
