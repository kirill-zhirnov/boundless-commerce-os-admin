import DataProvider from '../../../../modules/dataProvider/index';

export default class ImportResultsDataProvider extends DataProvider {
	createQuery() {
		this.q.field('pl.log_id');
		this.q.field('pl.import_id');
		this.q.field('pl.file_name');
		this.q.field('pl.status');
		this.q.field('to_char(pl.started_at, \'DD.MM.YYYY, HH24:MI\')', 'started_at');
		this.q.field('pl.completed_at');
		this.q.field('pl.result');
		this.q.field('p.type');
		this.q.field('p.run');
		this.q.field('p.source_type');
		this.q.from('product_import', 'p');
		this.q.join('product_import_log', 'pl', 'p.import_id = pl.import_id');
		this.q.where('p.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('p.site_id = ?', this.getEditingSite().site_id);
		return this.q.where('pl.status in ?', ['success', 'error']);
	}

	sortRules() {
		return {
			default: [{started : 'desc'}],
			attrs: {
				started : 'pl.started_at'
			}
		};
	}
}