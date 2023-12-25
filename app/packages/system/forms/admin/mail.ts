import Form from '../../../../modules/form/index';

interface IAttrs {
	logo: string;
	signature: string;
}

export default class MailSettingsForm extends Form<IAttrs> {
	getRules() {
		return [
			['logo, signature', 'safe'],
		];
	}

	async setupAttrs() {
		const templateSettings = await this.getSetting('mail', 'template');

		this.setAttributes(Object.assign({}, templateSettings));
	}

	async save() {
		const {signature} = this.getSafeAttrs();

		const settings = await this.getSetting('mail', 'template') || {};

		await this.setSetting('mail', 'template', Object.assign(settings, {signature}));
	}
}