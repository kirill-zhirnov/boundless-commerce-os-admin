import DataProvider from '../../../../modules/dataProvider/index';

export default class WebhookDataProvider extends DataProvider {
	getRules() {
		return super.getRules().concat([
			['name, url', 'safe']
		]);
	}

	createQuery() {
		this.q.from('webhook');

		const name = this.getSafeAttr('name');
		if (name) {
			this.q.where('lower(name) like lower(?)', `%${name}%`);
		}
		this.compare('url', this.getSafeAttr('url'), true);
	}

	sortRules() {
		return {
			default: [{name: 'asc'}],
			attrs: {
				name: 'name'
			}
		};
	}
}