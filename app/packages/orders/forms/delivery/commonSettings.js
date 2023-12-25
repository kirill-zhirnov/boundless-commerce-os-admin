// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');
const validator = pathAlias('@modules/validator/validator');

class CommonSettingsForm extends Form {
	constructor(options) {
		if (options == null) { options = {}; }
		super(...arguments);

		this.deliverySettings = null;
	}

	getRules() {
		return [
			['defaultProductWeight, length, width, height', 'required'],
			['defaultProductWeight, length, width, height', 'isDotNumeric'],
			['fullname, address, postcode, useDimensions, hideDeliveryTime', 'safe']
		];
	}

	setup() {
		const deferred = Q.defer();

		super.setup(...arguments)
		.then(() => {
			return this.getRegistry().getSettings().get('delivery', 'settings');
	}).then(settings => {
			this.deliverySettings = settings;

			_.extend(this.attributes, _.pick(this.deliverySettings, [
				'defaultProductWeight',
				'defaultProductDimensions',
				'postInfo',
				'useDimensions',
				'hideDeliveryTime'
			])
			);

			return deferred.resolve();
		}).done();

		return deferred.promise;
	}

	save() {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();

		const dimensions = {};
		['width', 'height', 'length'].forEach(key => {
			const val = Number(attrs[key]);
			if (val) {
				return dimensions[key] = val;
			}
		});

		const res = _.extend(this.deliverySettings, {
			defaultProductWeight: Number(attrs.defaultProductWeight),
			useDimensions: attrs.useDimensions === '1',
			hideDeliveryTime: attrs.hideDeliveryTime === '1',
			defaultProductDimensions: dimensions,
			postInfo: _.pick(attrs, [
				'fullname',
				'address',
				'postcode'
			])
		});

		this.getRegistry().getSettings().set('delivery', 'settings', this.deliverySettings)
		.then(() => {
			return deferred.resolve();
	}).catch(e => {
			return deferred.reject(e);
		}).done();

		return deferred.promise;
	}
}

module.exports = CommonSettingsForm;
