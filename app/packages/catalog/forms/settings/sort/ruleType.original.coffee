module.exports = (i18n) ->
	return [
		['availability', i18n.p__('sort', 'Availability')],
		['price', i18n.__('Price')],
		['name', i18n.__('Name')],
		['created_at', i18n.__('Date creation')],
	]