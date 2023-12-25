pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'
validator = pathAlias '@modules/validator/validator'

class CommonSettingsForm extends Form
	constructor : (options = {}) ->
		super

		@deliverySettings = null

	getRules : ->
		return [
			['defaultProductWeight, length, width, height', 'required'],
			['defaultProductWeight, length, width, height', 'isDotNumeric'],
			['fullname, address, postcode, useDimensions, hideDeliveryTime', 'safe']
		]

	setup : ->
		deferred = Q.defer()

		super
		.then () =>
			return @getRegistry().getSettings().get('delivery', 'settings')
		.then (settings) =>
			@deliverySettings = settings

			_.extend @attributes, _.pick(@deliverySettings, [
				'defaultProductWeight',
				'defaultProductDimensions',
				'postInfo',
				'useDimensions',
				'hideDeliveryTime'
			])

			deferred.resolve()
		.done()

		return deferred.promise

	save : ->
		deferred = Q.defer()

		attrs = @getSafeAttrs()

		dimensions = {}
		['width', 'height', 'length'].forEach (key) =>
			val = Number(attrs[key])
			if val
				dimensions[key] = val

		res = _.extend @deliverySettings, {
			defaultProductWeight: Number(attrs.defaultProductWeight),
			useDimensions: attrs.useDimensions == '1'
			hideDeliveryTime: attrs.hideDeliveryTime == '1'
			defaultProductDimensions: dimensions,
			postInfo: _.pick(attrs, [
				'fullname',
				'address',
				'postcode'
			])
		}

		@getRegistry().getSettings().set('delivery', 'settings', @deliverySettings)
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.reject e
		.done()

		return deferred.promise

module.exports = CommonSettingsForm
