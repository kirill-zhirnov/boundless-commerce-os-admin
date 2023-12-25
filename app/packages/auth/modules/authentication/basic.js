import squel from '../../../../modules/db/squel';
import _ from 'underscore';

export default class BasicAuthentication {
	constructor(instanceRegistry, lang) {
//		@user - instance of @modules/authentication/user
		this.instanceRegistry = instanceRegistry;
		this.lang = lang;
		this.user = null;

//		user row (JSON)
		this.userJson = null;
	}

	async make() {
		const userJson = await this.getUser();

		//@ts-ignore
		if (userJson) {
			//@ts-ignore
			await this.user.setUser(userJson.id, userJson.roles, userJson.states);
			return true;
		}

		return false;
	}

	getUser() {
		throw new Error('Method should be implemented in successors.');
	}

	getUserSql() {
		const sql = squel.select();

		sql.field('person.person_id');
		sql.field('person.email');
		sql.field('role.alias as role');
		sql.field('person_settings.settings');
		sql.field('person.registered_at');
		sql.field('person.is_owner');

		sql.field('person_profile.first_name');
		sql.field('person_profile.last_name');
		sql.field('person_profile.phone');

		sql.field('vw_country.country_id');
		sql.field('vw_country .title', 'country_title');

		sql.from('person');
		sql.join('person_auth', null, 'person.person_id = person_auth.person_id');
		sql.join('person_settings', null, 'person.person_id = person_settings.person_id');
		sql.join('person_profile', null, 'person.person_id = person_profile.person_id');
		sql.left_join('person_role_rel', null, 'person_role_rel.person_id = person.person_id');
		sql.left_join('role', null, 'role.role_id = person_role_rel.role_id');
		sql.left_join('person_address', null, 'person_address.person_id = person.person_id and person_address.is_default is true');
		sql.left_join('vw_country', null, 'vw_country.country_id = person_address.country_id and vw_country.lang_id = 1');

		sql.where('person.deleted_at is null');
		sql.where('person.status = ?', 'published');

		return sql;
	}

	rowsToUserJson(rows) {
		let userJson;
		if (rows.length === 0) {
			userJson = false;
		} else {
			userJson = {
				id: rows[0].person_id,
				roles: [],
				states: {
					registered_at: rows[0].registered_at,
					profile: this.prepareUserProfile(rows[0]),
					settings: rows[0].settings || {},
					is_owner: rows[0].is_owner
				}
			};

			for (const row of rows) {
				if (row.role) {
					userJson.roles.push(row.role);
				}
			}
		}

		return userJson;
	}

	prepareUserProfile(row) {
		const profile = _.pick(row, [
			'email',

			'first_name',
			'last_name',
			'phone',

			'country_id',
			'country_title',
		]);

		return profile;
	}

	getInstanceRegistry() {
		return this.instanceRegistry;
	}

	getDb() {
		return this.instanceRegistry.getDb();
	}
}
