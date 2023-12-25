// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');

class Props extends Form {
	getRules() {
		return [
			['layout', 'inOptions', {options: 'layout'}],
		];
	}

	loadRecord() {
		return this.getModel('manufacturer').findException({
			where: {
				manufacturer_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['layout']));

		return this.setAttributes(attrs);
	}

	save() {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();

		this.getRecord()
		.then(record => {
			return record.set(_.pick(attrs, ['layout'])).save();
	}).then(() => {
			return deferred.resolve();
		}).done();

		return deferred.promise;
	}

	rawOptions() {
		return {
			layout : this.getView().getPublicLayoutsOptions()
		};
	}
}

module.exports = Props;
