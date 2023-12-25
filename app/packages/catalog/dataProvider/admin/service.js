import DataProvider from '../../../../modules/dataProvider/index';

export default class ServiceDataProvider extends DataProvider {
	getRules() {
		return [
			['id,title,price', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.from('service', 's');
		this.q.join('service_text', 'st', 'st.service_id = s.service_id');
		this.q.where('st.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('s.show_in_list = true');

		this.compareRmStatus('s.deleted_at');
		this.compare('s.service_id', this.getSafeAttr('service_id'));
		this.compare('st.title', this.getSafeAttr('title'), true);
		return this.compareNumber('s.price', this.getSafeAttr('price'));
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				service_id: 's.service_id',
				title: 'st.title'
			}
		};
	}
}