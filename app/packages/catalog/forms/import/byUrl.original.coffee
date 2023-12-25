pathAlias = require 'path-alias'
Form = pathAlias '@modules/form/index'
Q = require 'q'
_ = require 'underscore'

class ImportByUrl extends Form
	constructor: (options) ->
		super

		@runType = options.runType || 'once'
		@importLogId = null

	getRules: ->
		rules = [
			['url, type', 'required'],
			['url', 'isURL', {require_protocol: true}],
			['url', 'validateCronQty'],
			['type', 'inOptions', {options: 'type'}],
			['encoding', 'inOptions', {options: 'encoding'}],
			['delimiter', 'inOptions', {options: 'delimiter'}],
			['quote', 'inOptions', {options: 'quote'}],
			['escape', 'inOptions', {options: 'escape'}]
			['detect_variants_by', 'inOptions', {options: 'detectVariants'}],
		]

		if @runType == 'cron'
			rules.push ['schedule', 'inOptions', {options: 'schedule'}]
			rules.push ['schedule', 'required']

		return rules

	setup : ->
		return super
		.then () =>
			_.defaults @attributes, {
				detect_variants_by : ''
			}

			return

	loadRecord: ->
		return @getDb().model('productImport').findException({
			where :
				import_id : @pk
		})

	setupAttrsByRecord: ->
		row = @record.toJSON()

		attrs = _.pick row, ['url', 'type']

		attrs.csvDelimeters = {}

		if row.settings
			if row.settings.csvDelimeters
				attrs.csvDelimeters = row.settings.csvDelimeters

			if row.settings.encoding
				attrs.csvDelimeters.encoding = row.settings.encoding

			if row.settings.cron_rule
				attrs.schedule = row.settings.cron_rule

			if row.detect_variants_by
				attrs.detect_variants_by = row.detect_variants_by

		@setAttributes attrs

	save: () ->
		attrs = @getSafeAttrs()
		row = null

		return @getRecord()
		.then (val) =>
			if val
				row = val
			else
				row = @getModel('productImport').build()

			return @getModel('productImport').getYmlSettings()
		.then (defaultYmlSettings) =>
			upAttrs = _.pick(attrs, ['type', 'url'])

			_.extend(upAttrs, {
				site_id: @getEditingSite().site_id,
				lang_id: @getEditingLang().lang_id,
				person_id: @getUser().getId(),
				run: @runType,
				source_type: 'url',
				settings: row.settings || {}
			})

			switch attrs.type
				when 'csv'
					_.extend(upAttrs.settings, {
						csvDelimiters: _.pick(attrs, ['delimiter', 'quote', 'escape']),
						encoding: attrs.encoding
					})
				when 'yml'
					_.extend(upAttrs.settings, defaultYmlSettings, {
						detect_variants_by: attrs.detect_variants_by
					})

			if @runType == 'cron'
				upAttrs.settings.cron_rule = attrs.schedule

			return row.set(upAttrs).save()
		.then () =>
			@record = row
			@pk = row.import_id

			switch attrs.type
				when 'csv'
					return @getRegistry().getSettings().set('system', 'csvDelimiters', _.pick(attrs, ['delimiter', 'quote', 'escape', 'encoding']))
				else
					return
		.then () =>
			return @getModel('productImportLog').create {
				import_id: @record.import_id
				status: 'awaiting_download'
			}
		.then (importLog) =>
			@importLogId = importLog.log_id

			@getDb().model('productImport').startImport @getInstanceRegistry().getInstanceInfo().instance_id, @record.import_id, 'download'

			return

	getImportLogId : ->
		return @importLogId

	rawOptions: ->
		return _.extend @getModel('productImport').getDelimetersOptions(@getI18n()), {
			type: [
				['excel', @getI18n().__('Excel')],
				['csv', @getI18n().__('CSV')],
				['yml', @getI18n().__('YML')]
			],

			schedule: [
				['every_1_hour', @getI18n().__('Every hour')],
				['every_2_hours', @getI18n().__('Every 2 hours')],
				['every_1_day', @getI18n().__('Once a day')]
			]

			detectVariants : [
				['', @getI18n().__('Do not detect variants.')]
				['offerGroupId', @getI18n().__('Detect by "group_id"')]
				['sku', @getI18n().__('Detect by sku') + ' (vendorCode)']
			]
		}

	getTplData : ->
		data = null

		return super
		.then (d) =>
			data = d

			if !data.csvDelimiters
				return @getRegistry().getSettings().get('system', 'csvDelimiters')
		.then (delimiters) =>
			_.defaults data.attrs, {
				csvDelimiters: delimiters
				type: 'excel'
				run: @runType
			}

			return data

	validateCronQty : ->
		if @runType == 'once'
			return

		return @getDb().sql "
			select
				count(*) as qty
			from
				product_import
			where
				run = 'cron'
				and deleted_at is null
		"
		.then (rows) =>
			if Number(rows[0].qty) >= 2
				@addError 'url', 'cronLimit', @getI18n().__('Only 2 rules per account allowed')

			return

module.exports = ImportByUrl