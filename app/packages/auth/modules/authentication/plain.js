import BasicAuthentication from './basic';

// plain authentication by email and password
export default class PlainAuthentication extends BasicAuthentication {
//	@user - instance of @modules/authentication/user
	constructor(instanceRegistry, email, pass, site, lang, user) {
		super(instanceRegistry, lang);

		this.email = email;
		this.pass = pass;
		this.site = site;
		this.user = user;
	}

	async getUser() {
		if (this.userJson != null)
			return this.userJson;

		const select = this.getUserSql();
		select.where('person.site_id = ?', this.site.site_id);
		select.where('person.email = ?', this.email.toLowerCase());
		select.where('person.registered_at is not null');
		select.where('person_auth.pass = crypt(?, pass)', this.pass);

		const sql = select.toParam();
		const rows = await this.getDb().sql(sql.text, sql.values);
		this.userJson = this.rowsToUserJson(rows);

		return this.userJson;
	}
}