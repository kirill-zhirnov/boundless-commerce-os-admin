import CommodityGroup from '../commodityGroup';

export default class GroupQuickEdit extends CommodityGroup {
	constructor(options) {
		super(options);

		this.groupOptions = null;
	}

	getRules() {
		return [
			['group_title', 'required'],
			[
				'group_title',
				'isUnique',
				{
					model: this.getModel('commodityGroupText'),
					field: 'title',
					//@ts-ignore
					row: this.record ? this.record.commodityGroupTexts[0] : null,
					criteria: {
						where: {
							lang_id: this.getEditingLang().lang_id
						}
					}
				}
			]
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		let record = await this.getRecord();

		if (!record) {
			record = this.getModel('commodityGroup').build().set({
				//@ts-ignore
				type: 'material',
				unit_id: this.defaultUnitMeasurement,
				not_track_inventory: true
			});
			//@ts-ignore
			await record.save();
		}

		this.record = record;
		//@ts-ignore
		this.pk = record.group_id;

		await this.getModel('commodityGroupText').update({
			title: attrs.group_title
		}, {
			where: {
				//@ts-ignore
				group_id: record.group_id,
				lang_id: this.getEditingLang().lang_id
			}
		});

		await this.onFormsGroupSaved();

		//@ts-ignore
		this.groupOptions = await this.getModel('commodityGroup').fetchOptions(this.getEditingLang().lang_id);
	}
}