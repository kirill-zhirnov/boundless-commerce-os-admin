import Form from '../../../modules/form/index';

export default class ChangePassword extends Form {
	getRules() {
		return [
			['currentPassword, newPassword, confirmPassword', 'required'],
			['currentPassword', 'validateCurrentPassword'],
			['confirmPassword', 'validateConfirmPassword']
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const userId = this.getUser().getId();

		await this.getDb().sql(`
			update
				person_auth
			set
				pass = crypt(:pass, gen_salt('bf'))
			where
				person_id = :id
		`, {
			pass: attrs.newPassword,
			id: userId
		});
	}


	async validateCurrentPassword(value, options, field) {
		const userId = this.getUser().getId();

		const data = await this.getDb().sql(`
			select
				1
			from
				person_auth
			where
				person_id = :id
				and pass = crypt(:pass, pass)
		`, {id: userId, pass: value});

		if (data.length === 0) {
			this.addError(field, 'wrongPass', this.__('Wrong password'));
		}
		return true;
	}


	validateConfirmPassword(value, options, field) {
		if (value !== this.attributes.newPassword) {
			this.addError(field, 'passNotMatch', this.__('Passwords not match.'));
		}

		return true;
	}
}