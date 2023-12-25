import DataProvider from '../../../../modules/dataProvider/index';

export default class WarehouseDataProvider extends DataProvider {
	getRules() {
		return [
			['warehouse_id,title,address', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.from('warehouse', 'w');
		this.q.join('warehouse_text', 'wt', 'wt.warehouse_id = w.warehouse_id');
		this.q.where('wt.lang_id = ?', this.getEditingLang().lang_id);

		this.compareRmStatus('w.deleted_at');
		this.compare('w.warehouse_id', this.getSafeAttr('warehouse_id'));
		this.compare('wt.title', this.getSafeAttr('title'), true);
		this.compare('wt.address', this.getSafeAttr('address'), true);
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				warehouse_id: 'w.warehouse_id',
				title: 'wt.title',
				sort: 'w.sort'
			}
		};
	}
}