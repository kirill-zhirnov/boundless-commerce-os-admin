import Characteristic from './characteristic';
import _ from 'underscore';

export default class Folder extends Characteristic {
	getRules() {
		return [
			['title', 'required']
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('characteristic').findException({
			include: [
				{
					model: this.getModel('characteristicText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				}
			],

			where: {
				characteristic_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['characteristic_id']));
		_.extend(attrs, _.pick(row.characteristicTexts[0], [
			'title'
		])
		);

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord() || this.getModel('characteristic').build();

		//@ts-ignore
		if (row.isNewRecord) {
			//@ts-ignore
			row.group_id = this.getGroupId();
		}

		//@ts-ignore
		await row.save();

		//@ts-ignore
		this.setPk(row.characteristic_id);
		this.setRecord(row);

		const text = await this.findTextModel('characteristicText', {
			//@ts-ignore
			characteristic_id: row.characteristic_id,
			lang_id: this.getEditingLang().lang_id
		});

		text.set({
			title: attrs.title
		});

		await text.save();

		//@ts-ignore
		const prop = await row.getCharacteristicProp();
		prop.is_folder = true;

		await prop.save();
	}
}