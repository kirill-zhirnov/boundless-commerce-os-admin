import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class Seo extends Form {
	getRules() {
		return [
			[
				'custom_title, custom_header, meta_description, meta_keywords',
				'safe'
			]
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('manufacturerText').findException({
			where: {
				manufacturer_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	setupAttrsByRecord() {
		return this.setAttributes(this.record.toJSON());
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const updateAttrs = _.pick(attrs, ['custom_title', 'custom_header', 'meta_description', 'meta_keywords']);

		await this.getModel('manufacturerText').update(updateAttrs, {
			where: {
				manufacturer_id: this.pk,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}
}