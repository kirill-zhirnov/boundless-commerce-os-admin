import DataProvider from '../../../../modules/dataProvider/index';
import _ from 'underscore';

export default class FilterDataProvider extends DataProvider {
	getRules() {
		return [
			['filter_id', 'isNum', {min: 1, no_symbols: true}],
			['title,is_default', 'safe']
		//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.from('filter', 'f');

		//@ts-ignore
		const {filter_id, title, is_default} = this.getSafeAttrs();
		this.compare('f.filter_id', filter_id);
		this.compare('f.title', title, true);

		if (is_default === '1') {
			return this.q.where('f.is_default is true');
		} else if (is_default === '0') {
			return this.q.where('f.is_default is false');
		}
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'f.title'
			}
		};
	}

	rawOptions() {
		return _.extend(super.rawOptions(), {
			isDefault: [
				['', this.__('All')],
				['1', this.__('Yes')],
				['0', this.__('No')]
			]
		});
	}
}