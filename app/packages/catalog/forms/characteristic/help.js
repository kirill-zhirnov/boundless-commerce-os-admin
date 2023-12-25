import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class Help extends Form {
	getRules() {
		return [
			['help', 'safe']
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('characteristicText').findException({
			where: {
				characteristic_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['help']));

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord();
		//@ts-ignore
		row.set(_.pick(attrs, ['help']));

		//@ts-ignore
		await row.save();
	}
}