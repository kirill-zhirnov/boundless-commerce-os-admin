import DataProvider from '../../../../modules/dataProvider/index';

export default class ApiTokensDataProvider extends DataProvider {
	getRules() {
		return super.getRules().concat([
			['name', 'safe']
		]);
	}

	createQuery() {
		this.q.from('api_token');

		this.q.where('api_token.is_system is false and api_token.name is not null');
		this.compareRmStatus('api_token.deleted_at');

		this.compare('api_token.name', this.getSafeAttr('name'), true);
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