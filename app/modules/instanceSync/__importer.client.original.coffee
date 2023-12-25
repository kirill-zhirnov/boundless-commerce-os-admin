pathAlias = require 'path-alias'
_ = require 'underscore'
Widget = pathAlias '@widget'
Backbone = pathAlias '@bb'
serializer = pathAlias '@modules/serializer.@c'

class Importer

#	UnSerialize widgets by data and init widgets.
	import : (data) ->
		for type, dataList of data
			for id, props of dataList
				instance = serializer.unSerialize(props)

				switch type
					when "widget"
						instance.afterCSExport()
					when "model", "collection"
					else
						throw new Error "Constructor '#{type}'-'#{id}' has incorrect type"

module.exports = Importer