import Form from '../../../modules/form/index';
import IdAuth from '../modules/authentication/id';

export default class RestorePassword extends Form {
	constructor(options) {
		super(options);
		this.token = null;
		({tokenParams: this.tokenParams} = options);
	}

	getRules() {
		return [
			['newPassword, confirmPassword', 'required'],
			['confirmPassword', 'validateConfirmPassword'],
			['newPassword', 'validateToken']
		];
	}

	async getTplData() {
		const curToken = await this.getToken();
		const data = await super.getTplData();
		data.token = (curToken != null);
		data.tokenParams = this.tokenParams;

		return data;
	}

	async save() {
		await this.updatePassword(this.token.dataValues.person_id, this.getSafeAttrs().newPassword);
		await this.deleteToken();
		const idAuth = new IdAuth(this.getInstanceRegistry(), this.token.dataValues.person_id, this.getSite(), this.getLang(), this.getUser());
		await idAuth.make();
		await this.getUser().getPlugin('cookieAuth').createAndSetToken();
	}

	async getToken() {
		const personToken = this.getDb().model('personToken');

		if ((this.tokenParams.tokenId == null) || (this.tokenParams.token1 == null) || (this.tokenParams.token2 == null)) {
			return null;
		}

		return personToken.findToken('passRest', this.tokenParams.tokenId, this.tokenParams.token1, this.tokenParams.token2);
	}

	async updatePassword(userId, pass) {
		const sql = `
			update
				person_auth
			set
				pass = crypt(:pass, gen_salt('bf'))
			where
				person_id = :id
		`;

		await this.getDb().sql(sql, {pass, id: userId});
	}

	validateConfirmPassword(value, options, field) {
		if (value !== this.attributes.newPassword) {
			this.addError(field, 'passNotMatch', this.getI18n().__('Passwords not match.'));
		}

		return true;
	}

	async validateToken(value, options, field) {
		const token = await this.getToken();

		if (token != null) {
			this.token = token;
			// call rule from here becouse we can't get person_id differently
			await this.checkBannedPerson(value, options, field);
		} else {
			this.addError(field, 'invalidToken', this.getI18n().__('Invalid token. Please request a secret link again.'));
			return true;
		}
	}

	deleteToken() {
		const sql = `
			delete from
				person_token
			where
				token_id = :tokenId
		`;

		return this.getDb().sql(sql, {tokenId: this.token.dataValues.token_id});
	}

	async checkBannedPerson(value, options, field) {
		const sql = `
			select
				1
			from
				person
			where
				person_id = :id
				and deleted_at is null
		`;

		const rows = await this.getDb().sql(sql, {id: this.token.dataValues.person_id});

		if (rows.length === 0) {
			this.addError(field, 'bannedUser', this.getI18n().__('User with such email was banned.'));
		}

		return true;
	}
}