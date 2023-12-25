import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class Filter extends Form {
	constructor(options) {
		super(options);

		this.isNewRecord = null;
	}

	getRules() {
		return [
			['title', 'required'],
			['is_default', 'safe']
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('filter').findException({
			where: {
				filter_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const attrs = this.record.toJSON();
		attrs.is_default = attrs.is_default ? '1' : '0';

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		if (attrs.is_default === '1') {
			await this.getModel('filter').update({
				is_default: false
			}, {
				where: {}
			});
		}

		const record = await this.getRecord();
		const row = record || this.getModel('filter').build();
		const isNewRecord = !record;

		//@ts-ignore
		row.set(_.pick(attrs, ['title']));
		//@ts-ignore
		row.is_default = attrs.is_default === '1';

		//@ts-ignore
		await row.save();
		//@ts-ignore
		this.pk = row.filter_id;

		this.isNewRecord = isNewRecord;
		if (isNewRecord) {
			//@ts-ignore
			await this.getModel('filter').createDefaultFilterFields(row);
		}

		//@ts-ignore
		await this.getModel('filter').checkDefaultExists();
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.filter = this.pk;

		return data;
	}

	getIsNewRecord() {
		return this.isNewRecord;
	}
}