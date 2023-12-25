import Form from '../../../modules/form/index';
import PasswordRestoreMails from '../mails/passRestore';

export default class RestoreEmail extends Form {
	constructor(options) {
		super(options);

		this.userId = null;
		this.userName = null;
	}
	getRules() {
		return [
			['email', 'required'],
			['email', 'isEmail'],
			['email', 'checkEmailExists']
		];
	}

	async save() {
		const token = await this.generateToken();

		const customerMail = new PasswordRestoreMails(this.getInstanceRegistry());
		await customerMail.sendPasswordRestoreEmail(this.userName, this.getSafeAttrs().email, token);

		this.getSession().passRestore = {
			emailIsSent: true,
			email: this.getSafeAttrs().email
		};
	}

	generateToken() {
		const personToken = this.getDb().model('personToken');

		return personToken.createToken('passRest', this.userId, null, this.db.fn('interval \'30 minutes\' + NOW'));
	}

	async checkEmailExists(value, options, field) {
		const sql = `
			select
				person_id,
				first_name
			from
				person
			inner join person_profile using(person_id)
			where
				email = lower(:email)
				and deleted_at is null
		`;

		const rows = await this.getDb().sql(sql, {email: value});

		if (rows.length === 0) {
			this.addError(field, 'noSuchEmail', this.getI18n().__('There is no user with the given email.'));
		} else {
			this.userId = rows[0].person_id;
			this.userName = rows[0].first_name;
		}

		return true;
	}
}