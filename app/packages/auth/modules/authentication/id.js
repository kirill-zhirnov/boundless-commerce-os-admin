import BasicAuthentication from './basic';

export default class IdAuthentication extends BasicAuthentication {
	constructor(instanceRegistry, personId, site, lang, user) {
		super(instanceRegistry, lang);

		this.personId = personId;
		this.site = site;
		this.user = user;
	}

	async getUser() {
		if (this.userJson !== null) {
			return this.userJson;
		}

		const select = this.getUserSql();
		select.where('person.person_id = ?', this.personId);
		select.where('person.site_id = ?', this.site.site_id);

		const sql = select.toParam();
		const rows = await this.getDb().sql(sql.text, sql.values);

		this.userJson = this.rowsToUserJson(rows);
		return this.userJson;
	}
}