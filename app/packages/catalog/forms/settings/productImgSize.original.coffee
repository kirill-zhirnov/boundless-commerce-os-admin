pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'
thumbnailSize = pathAlias '@p-cms/modules/thumbnail/size'

class ProductImgSize extends Form
	getRules: ->
		return [
			['size', 'required']
			['size', 'inOptions', {options: 'size'}]
		]

	save: () ->
		deferred = Q.defer()

		@getRegistry().getSettings().set 'system', 'imgProportion', @getSafeAttr('size')
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	setup : ->
		deferred = Q.defer()

		super
		.then () =>
			return @getRegistry().getSettings().get('system', 'imgProportion')
		.then (value) =>
			@attributes.size = value

			deferred.resolve()
		.done()

		return deferred.promise

	rawOptions: ->
		return {
			size : @getSizeOptions()
		}

	getSizeOptions : (out = []) ->
		for val in thumbnailSize.getImgProportions()
			out.push [val, val]

		return out

module.exports = ProductImgSize
