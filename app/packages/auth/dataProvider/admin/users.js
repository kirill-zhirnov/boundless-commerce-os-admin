import DataProvider from '../../../../modules/dataProvider/index';

export default class UsersDataProvider extends DataProvider {
	getRules() {
		return super.getRules().concat([
			['name, email', 'safe']
		]);
	}

	createQuery() {
		this.q.field('r.role_title');
		this.q.field('person.*');
		this.q.field('person_profile.*');
		this.q.from('person');
		this.q.left_join('person_profile', null, 'person.person_id = person_profile.person_id');
		this.q.join(`(
			SELECT person_id, string_agg(r.title, ', ') role_title from person_role_rel
          JOIN role r on person_role_rel.role_id = r.role_id
      WHERE r.alias IN ('admin', 'orders-manager', 'content-manager')
      GROUP BY person_id
      ) r`, null, 'r.person_id = person.person_id');

		//@ts-ignore
		const {name} = this.getSafeAttrs();
		if (name) {
			const nameLike = `%${String(name).toLowerCase()}%`;
			this.q.where(`
				lower(person_profile.first_name) like ?
				or lower(person_profile.last_name) like ?
				or lower(person.email) like ?
				`, nameLike, nameLike, nameLike
			);
		}

		this.compareRmStatus('person.deleted_at');
	}

	sortRules() {
		return {
			default: [{name: 'asc'}],
			attrs: {
				name: {
					asc: 'first_name asc, last_name asc, person.email asc nulls last',
					desc: 'first_name desc, last_name desc, person.email desc nulls last'
				}
			}
		};
	}
}