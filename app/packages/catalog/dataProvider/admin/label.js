import DataProvider from '../../../../modules/dataProvider/index';

export default class LabelDataProvider extends DataProvider {
	constructor(options) {
		super(options);

		this.validPageSize.push(false);
	}

	getRules() {
		return [
			['title','safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.from('label');
		this.q.join('label_text', 'lt', 'lt.label_id = label.label_id');
		this.q.where('lt.lang_id = ?', this.getEditingLang().lang_id);
		this.compareRmStatus('label.deleted_at');

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		return this.compare('lt.title', attrs.title, true);
	}

	sortRules() {
		return {
			default: [{label : 'asc'}],
			attrs: {
				label : 'lt.title'
			}
		};
	}
}