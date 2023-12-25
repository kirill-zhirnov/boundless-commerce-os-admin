import DataProvider from '../../../../modules/dataProvider/index';
import {ITaxClass} from '../../../../@types/system';

export default class TaxClassDataProvider extends DataProvider<ITaxClass> {
	createQuery() {
		this.q.from('tax_class');
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'title'
			}
		};
	}
}