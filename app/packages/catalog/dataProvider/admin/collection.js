import DataProvider from '../../../../modules/dataProvider/index';

export default class CollectionDataProvider extends DataProvider {
	getRules() {
		return [
			['title, alias', 'safe']
			//@ts-ignore
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		this.q.from('collection');
		this.q.where('site_id = ?', this.getEditingSite().site_id);
		this.q.where('lang_id = ?', this.getEditingLang().lang_id);

		this.compareRmStatus('deleted_at');
		this.compare('title', this.getSafeAttr('title'), true);
		this.compare('alias', this.getSafeAttr('alias'), true);
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'collection.title'
			}
		};
	}
}