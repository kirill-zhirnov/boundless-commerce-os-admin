import Form from '../../../../modules/form/index';
import * as mustacheCompiler from '../../modules/mustacheCompiler';

interface IAttrs {
	site: string;
	productUrl: string;
	orderUrl: string;
	categoryUrl: string;
	loginUrl: string;
}

export default class FrontendSettingsForm extends Form<IAttrs> {
	getRules() {
		return [
			['site', 'isURL', {require_protocol: true}],
			['productUrl, orderUrl, categoryUrl', 'validateTemplate'],
			['loginUrl', 'safe']
		];
	}

	async setupAttrs() {
		const frontendSettings = await this.getSetting('system', 'frontendUrls');

		this.setAttributes(Object.assign({}, frontendSettings));
	}

	async save() {
		const {site, productUrl, orderUrl, categoryUrl, loginUrl} = this.getSafeAttrs();

		await this.setSetting('system', 'frontendUrls', {site, productUrl, orderUrl, categoryUrl, loginUrl});
	}

	validateTemplate(value, options, field) {
		try {
			mustacheCompiler.vmCompile(value, {});
		} catch (e) {
			this.addError(field, 'notValidTemplate', this.__('Template has incorrect syntax.'));
		}
	}
}