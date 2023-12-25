import DataProvider from '../../../../modules/dataProvider/index';

export default class FilterFieldDataProvider extends DataProvider {
	getRules() {
		return [
			['filterId', 'isNum'],
			['filterId', 'required']
		//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const escapedLangId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('f.field_id');
		this.q.field('f.type');
		this.q.field('f.sort');
		this.q.field('c.characteristic_id');
		this.q.field('ct.title', 'characteristic_title');

		this.q.from('filter_field', 'f');
		this.q.left_join('characteristic', 'c', 'f.characteristic_id = c.characteristic_id');
		this.q.left_join('characteristic_text', 'ct', `ct.characteristic_id = c.characteristic_id and ct.lang_id = ${escapedLangId}`);

		const filterId = this.getSafeAttr('filterId');
		if (!filterId) {
			throw new Error('You must specify filterId!');
		}

		this.q.where('f.filter_id = ?', filterId);
		return this.q.where('f.type != ?', 'category');
	}

	prepareData(rows) {
		const out = [];
		for (const row of rows) {
			out.push({
				id: row.field_id,
				title: this.getTitleByRow(row),
				type: row.type
			});
		}

		return out;
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				sort: 'f.sort'
			}
		};
	}

	getTitleByRow(row) {
		switch (row.type) {
			case 'category':
				return this.__('Category');
			case 'brand':
				return this.__('Manufacturer');
			case 'price':
				return this.__('Price');
			case 'availability':
				return this.__('Is in stock?');
			case 'characteristic':
				return row.characteristic_title;
		}
	}

	getPageSize() {
		return false;
	}
}