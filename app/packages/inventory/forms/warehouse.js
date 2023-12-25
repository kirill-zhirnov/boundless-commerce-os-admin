import Form from '../../../modules/form/index';
import _ from 'underscore';

export default class Warehouse extends Form {
	getRules() {
		return [
			['title', 'required'],
			['title', 'isUnique', {
				field: 'title',
				//@ts-ignore
				row: this.record ? this.record.warehouseTexts[0] : null,
				model: this.getModel('warehouseText'),
				criteria: {
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				}

			}],
			['address', 'safe'],
			['sort', 'isNum']
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('warehouse').findException({
			include: [{
				model: this.getModel('warehouseText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				warehouse_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['sort']));
		_.extend(attrs, _.pick(row.warehouseTexts[0], [
			'title', 'address'
		])
		);

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord() || this.getModel('warehouse').build();
		//@ts-ignore
		await row.save();

		//@ts-ignore
		this.pk = row.warehouse_id;

		const text = await this.findTextModel('warehouseText', {
			//@ts-ignore
			warehouse_id: row.warehouse_id,
			lang_id: this.getEditingLang().lang_id
		});

		text.set({
			title: attrs.title,
			address: attrs.address
		});

		await text.save();
	}
}