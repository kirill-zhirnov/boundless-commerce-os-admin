import Form from '../../../../modules/form/index';

export default class ManufacturerQuickEditForm extends Form {
	constructor(options) {
		super(options);

		this.manufacturerOptions = null;
	}

	getRules() {
		return [
			['manufacturer_title', 'required'],
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();
		let isNew = false;

		let record = await this.getRecord();
		if (!record) {
			record = await this.getModel('manufacturer').create({});
			isNew = true;
			this.pk = record.manufacturer_id;
		}

		const textAttrs = {
			title: attrs.manufacturer_title
		};

		if (isNew) {
			textAttrs.url_key = await this.getModel('manufacturer').createUrlKeyByTitle(
				attrs.manufacturer_title,
				this.getEditingLang().code
			);
		}

		await this.getModel('manufacturerText').update(textAttrs, {
			where: {
				manufacturer_id: record.manufacturer_id,
				lang_id: this.getEditingLang().lang_id
			}
		});

		await this.essenceChanged('manufacturer', this.pk, 'change');

		this.manufacturerOptions = await this.getModel('manufacturer').findOptions(
			this.getEditingLang().lang_id
		);
	}

	setupAttrsByRecord() {
		this.setAttributes({
			manufacturer_title: this.record.manufacturerTexts[0].title
		});
	}

	loadRecord() {
		return this.getModel('manufacturer').findException({
			include: [
				{
					model: this.getModel('manufacturerText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				}
			],
			where: {
				manufacturer_id: this.pk
			}
		});
	}
}