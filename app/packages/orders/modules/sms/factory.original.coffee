pathAlias = require 'path-alias'

Unisender = pathAlias '@p-orders/modules/sms/providers/unisender'
Smspilot = pathAlias '@p-orders/modules/sms/providers/smspilot'

module.exports.createProvider = (row, lang) ->
	switch row.alias
		when 'unisender'
			provider = new Unisender(row, lang)
		when 'smspilot'
			provider = new Smspilot(row)
		else
			provider = null

	return provider