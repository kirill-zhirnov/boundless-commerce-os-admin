import Form from '../../../modules/form/index';
import _ from 'underscore';

export default class Manufacturer extends Form {
	getRules() {
		return [
			['url_key', 'urlKey'],
			[
				'url_key',
				'isUnique',
				{
					model: this.getModel('manufacturerText'),
					//@ts-ignore
					row: this.record ? this.record.manufacturerTexts[0] : null,
					criteria: {
						where: {
							lang_id: this.getEditingLang().lang_id
						}
					}
				}
			],
			['title', 'required'],
			['description', 'safe'],
			['layout', 'inOptions', {options: 'layout'}],
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('manufacturer').findException({
			include: [{
				model: this.getModel('manufacturerText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				manufacturer_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['manufacturer_id']));

		_.extend(attrs, _.pick(row.manufacturerTexts[0], [
			'title', 'url_key', 'description'
		])
		);

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord() || this.getModel('manufacturer').build();

		//@ts-ignore
		row.set({
			status: 'published',
			created_by: null
		});

		//@ts-ignore
		await row.save();
		//@ts-ignore
		this.pk = row.manufacturer_id;

		await this.getModel('manufacturerText').update({
			title: attrs.title,
			description: attrs.description,
			url_key: attrs.url_key
		}, {
			where: {
				manufacturer_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	onFormsGroupSaved() {
		return this.essenceChanged('manufacturer', this.pk, 'change');
	}
}