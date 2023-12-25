import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class CsvDelimiters extends Form {
	constructor(options) {
		super(options);

		this.importId = options.importId;
		this.productImport = null;
	}

	getRules() {
		return [
			['delimiter, quote, escape, encoding', 'required'],
			['encoding', 'inOptions', {options: 'encoding'}],
			['delimiter', 'inOptions', {options: 'delimiter'}],
			['quote', 'inOptions', {options: 'quote'}],
			['escape', 'inOptions', {options: 'escape'}]
		];
	}

	async setup() {
		await super.setup();

		//@ts-ignore
		this.productImport = await this.getDb().model('productImport').findException({
			where: {
				import_id: this.importId
			}
		});

		let delimiters;

		if (this.productImport.settings && 'csvDelimiters' in this.productImport.settings) {
			delimiters = this.productImport.settings.csvDelimiters;
		} else {
			delimiters = await this.getRegistry().getSettings().get('system', 'csvDelimiters');
		}
		this.setAttributes(delimiters);
	}

	async save() {
		const csvDelimiters = _.pick(this.getSafeAttrs(), ['delimiter', 'quote', 'escape']);

		if (!this.productImport.settings) {
			this.productImport.settings = {};
		}

		const encoding = this.getSafeAttr('encoding');
		this.productImport.settings.csvDelimiters = csvDelimiters;
		this.productImport.settings.encoding = encoding;

		await this.productImport.save();
		await this.getRegistry().getSettings().set('system', 'csvDelimiters', _.extend(csvDelimiters, {
			encoding
		}));
	}

	rawOptions() {
		//@ts-ignore
		return this.getModel('productImport').getDelimetersOptions(this.getI18n());
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.importId = this.importId;

		return data;
	}
}