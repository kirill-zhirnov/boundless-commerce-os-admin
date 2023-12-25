// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const _ = require('underscore');

class ImportByUrl extends Form {
	constructor(options) {
		super(...arguments);

		this.runType = options.runType || 'once';
		this.importLogId = null;
	}

	getRules() {
		const rules = [
			['url, type', 'required'],
			['url', 'isURL', {require_protocol: true}],
			['url', 'validateCronQty'],
			['type', 'inOptions', {options: 'type'}],
			['encoding', 'inOptions', {options: 'encoding'}],
			['delimiter', 'inOptions', {options: 'delimiter'}],
			['quote', 'inOptions', {options: 'quote'}],
			['escape', 'inOptions', {options: 'escape'}],
			['detect_variants_by', 'inOptions', {options: 'detectVariants'}],
		];

		if (this.runType === 'cron') {
			rules.push(['schedule', 'inOptions', {options: 'schedule'}]);
			rules.push(['schedule', 'required']);
		}

		return rules;
	}

	setup() {
		return super.setup(...arguments)
		.then(() => {
			_.defaults(this.attributes, {
				detect_variants_by : ''
			});

		});
	}

	loadRecord() {
		return this.getDb().model('productImport').findException({
			where : {
				import_id : this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.pick(row, ['url', 'type']);

		attrs.csvDelimeters = {};

		if (row.settings) {
			if (row.settings.csvDelimeters) {
				attrs.csvDelimeters = row.settings.csvDelimeters;
			}

			if (row.settings.encoding) {
				attrs.csvDelimeters.encoding = row.settings.encoding;
			}

			if (row.settings.cron_rule) {
				attrs.schedule = row.settings.cron_rule;
			}

			if (row.detect_variants_by) {
				attrs.detect_variants_by = row.detect_variants_by;
			}
		}

		return this.setAttributes(attrs);
	}

	save() {
		const attrs = this.getSafeAttrs();
		let row = null;

		return this.getRecord()
		.then(val => {
			if (val) {
				row = val;
			} else {
				row = this.getModel('productImport').build();
			}

			return this.getModel('productImport').getYmlSettings();
	}).then(defaultYmlSettings => {
			const upAttrs = _.pick(attrs, ['type', 'url']);

			_.extend(upAttrs, {
				site_id: this.getEditingSite().site_id,
				lang_id: this.getEditingLang().lang_id,
				person_id: this.getUser().getId(),
				run: this.runType,
				source_type: 'url',
				settings: row.settings || {}
			});

			switch (attrs.type) {
				case 'csv':
					_.extend(upAttrs.settings, {
						csvDelimiters: _.pick(attrs, ['delimiter', 'quote', 'escape']),
						encoding: attrs.encoding
					});
					break;
				case 'yml':
					_.extend(upAttrs.settings, defaultYmlSettings, {
						detect_variants_by: attrs.detect_variants_by
					});
					break;
			}

			if (this.runType === 'cron') {
				upAttrs.settings.cron_rule = attrs.schedule;
			}

			return row.set(upAttrs).save();
		}).then(() => {
			this.record = row;
			this.pk = row.import_id;

			switch (attrs.type) {
				case 'csv':
					return this.getRegistry().getSettings().set('system', 'csvDelimiters', _.pick(attrs, ['delimiter', 'quote', 'escape', 'encoding']));
				default:
					return;
			}
		}).then(() => {
			return this.getModel('productImportLog').create({
				import_id: this.record.import_id,
				status: 'awaiting_download'
			});
				})
		.then(importLog => {
			this.importLogId = importLog.log_id;

			return this.getInstanceRegistry().getEventPublisher().publish('runCmd', {
				cmd: 'import',
				import_id: this.record.import_id,
				action: 'download',
				options: {
					detached: this.detached,
					stdio: 'ignore'
				}
			});
		});
	}

	getImportLogId() {
		return this.importLogId;
	}

	rawOptions() {
		return _.extend(this.getModel('productImport').getDelimetersOptions(this.getI18n()), {
			type: [
				['excel', this.getI18n().__('Excel')],
				['csv', this.getI18n().__('CSV')],
				['yml', this.getI18n().__('YML')]
			],

			schedule: [
				['every_1_hour', this.getI18n().__('Every hour')],
				['every_2_hours', this.getI18n().__('Every 2 hours')],
				['every_1_day', this.getI18n().__('Once a day')]
			],

			detectVariants : [
				['', this.getI18n().__('Do not detect variants.')],
				['offerGroupId', this.getI18n().__('Detect by "group_id"')],
				['sku', this.getI18n().__('Detect by sku') + ' (vendorCode)']
			]
		});
	}

	getTplData() {
		let data = null;

		return super.getTplData(...arguments)
		.then(d => {
			data = d;

			if (!data.csvDelimiters) {
				return this.getRegistry().getSettings().get('system', 'csvDelimiters');
			}
	}).then(delimiters => {
			_.defaults(data.attrs, {
				csvDelimiters: delimiters,
				type: 'excel',
				run: this.runType
			});

			return data;
		});
	}

	validateCronQty() {
		if (this.runType === 'once') {
			return;
		}

		return this.getDb().sql(`
			select 
			count(*) as qty 
			from 
			product_import 
			where 
			run = 'cron' 
			and deleted_at is null
`).then(rows => {
			if (Number(rows[0].qty) >= 2) {
				this.addError('url', 'cronLimit', this.getI18n().__('Only 2 rules per account allowed'));
			}

		});
	}
}

module.exports = ImportByUrl;
