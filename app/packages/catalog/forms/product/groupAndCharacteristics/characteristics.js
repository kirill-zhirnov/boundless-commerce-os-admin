import GroupAndCharacteristicsForm from '../groupAndCharacteristics';

/**
 * Form needs to reload characteristics and commodity group settings, if user changes a commodity group.
 */
export default class Characteristics extends GroupAndCharacteristicsForm {
	//@ts-ignore
	getRules() {
		return [
			['group_id', 'required'],
			['group_id', 'inOptions', {options: 'group'}]
		];
	}

	async save() {
		throw new Error('not for save!');
	}

	async getTplData() {
		const data = await super.getTplData();

		//@ts-ignore
		const group = await this.getModel('commodityGroup').findException({
			include: [
				{
					model: this.getModel('unitMeasurement')
				}
			],
			where: {
				group_id: this.attributes.group_id
			}
		});
		data.commodityGroup = this.getCommodityGroupSettings(group);

		return data;
	}
}