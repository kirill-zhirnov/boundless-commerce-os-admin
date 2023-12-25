Q = require 'q'
_ = require 'underscore'
pathAlias = require 'path-alias'
providerFactory = pathAlias '@p-orders/modules/sms/factory'
mustacheCompiler = pathAlias '@p-system/modules/mustacheCompiler'

class SmsSender
	constructor: (@db, @lang) ->
		@provider = null

	send: (recipient, message) ->
		return @getProvider().send(recipient, message)

	sendByEventAlias: (alias, data) ->
		deferred = Q.defer()

		@loadEvent alias, data.order_status_id
		.then (event) =>
			if !event
				return
			else
				return @sendByEventRow(event, data)
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.reject e
		.done()

		return deferred.promise

	sendByEventRow: (eventRow, data) ->
		deferred = Q.defer()

		@loadProvider()
		.then () =>
			data.template = eventRow.template
			data.event_id = eventRow.event_id
			return @sendByData data
		.then () =>
			deferred.resolve()
		.catch (e) =>
			deferred.reject e
		.done()

		return deferred.promise

	sendByData: (data) ->
		deferred = Q.defer()

		Q()
		.then () =>
			if data.message
				return data.message
			else if data.template
				return @compileTemplate data.template, _.omit(data, [
					'order_status_id',
					'recipient',
					'message',
					'person_id',
					'event_id'
				])
			else
				throw new Error('No message or message template')
		.then (message) =>
			data.message = message

			if !data.recipient
				throw new Error('No recipient to send to')

			return @send data.recipient, data.message
		.then () =>
			return @log data
		.then () =>
			deferred.resolve()
		.catch (e) =>
			@log data, e
			.then () =>
				deferred.reject e
			.done()
		.done()

		return deferred.resolve()

	loadProvider: (alias = 'smspilot') ->
		currentProvider = @getProvider()

		if currentProvider && currentProvider.getAlias() == alias
			return Q currentProvider

		deferred = Q.defer()

		@loadProviderRow(alias)
		.then (row) =>
			if row
				@setProvider providerFactory.createProvider(row, @getLang())
			else
				@setProvider null

			deferred.resolve @getProvider()
		.done()

		return deferred.promise

	loadProviderRow: (alias) ->
		deferred = Q.defer()

		@getDb().sql "
			select
				*
			from
				sms_service
				inner join sms_provider using(provider_id)
			where
				alias = :alias
		", {
			alias: alias
		}
		.then (rows) =>
			deferred.resolve rows[0]
		.done()

		return deferred.promise

	loadEvent: (alias, statusId = null) ->
		deferred = Q.defer()

		@getDb().sql "
			select
				*
			from
				sms_event
				left join sms_template using (event_id)
			where
				sms_event.alias = :alias
				and sms_template.lang_id = :lang
				and sms_event.deleted_at is null
				#{if statusId then 'and order_status_id = :status' else ''}
		", {
			alias: alias
			status: statusId
			lang: @getLang().lang_id
		}
		.then (rows) =>
			deferred.resolve rows[0]
		.done()

		return deferred.promise

	log: (data, error = null) ->
		if !@getProvider()
			return Q()

		deferred = Q.defer()

		if !error
			data.status = 'success'
		else
			data.status = 'error'
			data.error = error

		data.service_id = @getProvider().getServiceId()

		Q @getDb().model('smsLog').create data
		.then () =>
			deferred.resolve()
		.done()

		return deferred.promise

	compileTemplate: (template, data) ->
		return mustacheCompiler.compile template, data

	getProvider: ->
		return @provider

	setProvider: (provider) ->
		@provider = provider
		return

	getLang: ->
		return @lang

	getDb: ->
		return @db

module.exports = SmsSender