import Form from '../../../modules/form/index';

export default class RobotsTxt extends Form {
	getRules() {
		return [
			['content', 'safe']
		];
	}

	async setup() {
		await super.setup();

		this.attributes.content = await this.getInstanceRegistry().getSettings().get('cms', 'robots.txt');
	}

	async save() {
		await this.getInstanceRegistry().getSettings().set('cms', 'robots.txt', this.getSafeAttr('content'));
	}
}