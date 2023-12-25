import DataProvider from '../../../../modules/dataProvider/index';

export default class OrderStatusDataProvider extends DataProvider {
	getRules() {
		return super.getRules().concat([
			['alias, sort', 'safe']
		]);
	}

	createQuery() {
		const escapedLangId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.from('order_status', 'os');
		this.q.left_join('order_status_text', 'ost', `os.status_id = ost.status_id and ost.lang_id = ${escapedLangId}`);

		this.compareRmStatus('os.deleted_at');

		this.compare('os.alias', this.getSafeAttr('alias'), true);
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				sort: 'sort'
			}
		};
	}
}