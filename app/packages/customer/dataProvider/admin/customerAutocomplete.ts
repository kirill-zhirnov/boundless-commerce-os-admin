import DataProvider from '../../../../modules/dataProvider/index';

interface IRow {
	person_id: number;
	email: number|null;
	first_name: string|null;
	last_name: string|null;
	phone: string|null;
	comment: string|null;
	address_id: number|null;
	city: string|null;
	state: string|null;
	country: string|null;
	zip: string|null;
}

export default class CustomerAutocomplete extends DataProvider<IRow> {
	getRules() {
		return [
			['q', 'required'],
			['q', 'trim'],
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const langId = this.getEditingLang().lang_id;
		const escapedLang = this.getDb().escape(langId);

		this.q.field('p.person_id');
		this.q.field('p.email');
		this.q.field('pp.first_name');
		this.q.field('pp.last_name');
		this.q.field('pp.phone');
		this.q.field('pp.comment');
		this.q.field('pa.address_id');
		this.q.field('pa.city');
		this.q.field('pa.state');
		this.q.field('vw_country.title', 'country');
		this.q.field('pa.zip');

		this.q.from('person', 'p');
		this.q.join('person_profile', 'pp', 'p.person_id = pp.person_id');
		this.q.join('person_search', 'ps', 'ps.person_id = p.person_id');
		this.q.left_join('person_address', 'pa', 'p.person_id = pa.person_id and pa.is_default is true');
		this.q.left_join('vw_country', null, `vw_country.country_id = pa.country_id and vw_country.lang_id = ${escapedLang}`);

		const q = String(`%${this.getSafeAttr('q')}%`).toLowerCase();
		let id = Number(this.getSafeAttr('q'));
		id = isNaN(id) ? 0 : id;

		this.q.where('(lower(ps.search) like ?) or p.person_id = ?', q, id);
		this.q.where('p.site_id = ?', this.getEditingSite().site_id);
		this.q.where('p.registered_at is not null');
		this.q.where('p.deleted_at is null');
	}

	getPageSize() {
		return 10;
	}

	prepareData(rows: IRow[]) {
		const out = [];

		for (const row of rows) {
			const fullName = ['first_name', 'last_name']
				.map(key => row[key]).filter(value => value !== null).join(' ');

			const city = ['city', 'state', 'country', 'zip']
				.map(key => row[key]).filter(value => value !== null).join(', ');

			const contact = ['email', 'phone']
				.map(key => row[key]).filter(value => value !== null).join(', ');

			out.push({
				id: row.person_id,
				fullName,
				city,
				contact,
				customer: row
			});
		}

		return out;
	}
}