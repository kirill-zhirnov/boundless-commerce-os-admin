import Form from '../../../modules/form/index';
import {IPersonModelStatic} from '../../customer/models/person';
import {IPersonProfileModelStatic} from '../../customer/models/personProfile';
import randomString from 'random-string';
import {IPersonAuthModelStatic} from '../../customer/models/personAuth';
import {IRoleModelStatic} from '../models/role';
import CustomerRegisterMails from '../../customer/mails/registerMails';
import {IRole, TRoleAlias} from '../../../@types/person';
import {Op} from 'sequelize';

interface IAttrs {
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	roles: TRoleAlias[] | null;
	generate_pass?: string | null;
}

export default class AdminUser extends Form<IAttrs> {
	getRules() {
		return [
			['email, roles', 'required'],
			['email, first_name, last_name', 'trim'],
			['email', 'isEmail'],
			['email', 'checkEmailExists'],
			['email', 'limitReached'],
			['generate_pass', 'safe'],
			['roles', 'checkRoles']
		];
	}

	async save() {
		if (!this.getUser().isOwner()) {
			throw new Error('Admins can be edited only by the owner');
		}

		const {email, first_name, last_name, generate_pass, roles} = this.getSafeAttrs();

		this.record = this.record || (this.getModel('person') as IPersonModelStatic).build();

		if (!this.pk) {
			this.record.set({
				site_id: this.getEditingSite().site_id,
				created_by: this.getUser().getId(),
				registered_at: this.getDb().fn('now')
			});
		}

		this.record.set({
			email
		});

		await this.record.save();

		await (this.getModel('personProfile') as IPersonProfileModelStatic).update({
			first_name,
			last_name,
		}, {
			where: {
				person_id: this.record.person_id
			}
		});
		if (!this.record.is_owner) {
			await (this.getModel('role') as IRoleModelStatic).setRoles(this.record.person_id, roles);
		}

		if (!this.pk || generate_pass === '1') {
			const pass = this.generatePassword();
			await (this.getModel('personAuth') as IPersonAuthModelStatic).updatePass(this.record.person_id, pass);

			const customerMail = new CustomerRegisterMails(this.getInstanceRegistry());
			await customerMail.sendWelcomeEmail(email, pass, first_name, this.url('auth/login/form', {}, true));
		}
	}

	loadRecord() {
		return (this.getModel('person') as IPersonModelStatic).findException({
			include: [this.getModel('personProfile'), this.getModel('role')],
			where: {
				person_id: this.pk
			}
		});
	}

	async setupAttrs() {
		await super.setupAttrs();

		if (this.record) {
			//@ts-ignore
			const {personProfile, roles} = this.record as {[key: string]: any};
			Object.assign(this.attributes, {
				first_name: personProfile.first_name,
				last_name: personProfile.last_name,
				roles: roles.map(({alias}) => alias)
			});
		}
	}

	async checkEmailExists(value, options, field) {
		value = String(this.attributes[field]).toLowerCase();
		const where = {email: value};
		if (this.pk) {
			Object.assign(where, {
				person_id: {
					[Op.ne]: this.pk
				}
			});
		}

		const record = await (this.getModel('person') as IPersonModelStatic).findOne({
			where
		});

		if (record) {
			this.addError(field, 'emailExists', this.__('User with this email already exists.'));
		}
	}

	generatePassword() {
		return randomString({
			length: 7,
			letters: true,
			numeric: true,
			special: false
		});
	}

	async rawOptions() {
		const roles = await this.getDb().sql<IRole>(`
			select *
			from role
			where alias in ('admin', 'orders-manager', 'content-manager')
			order by role_id desc
		`);

		return {
			roles: roles.map(({alias, title}) => [alias, title === 'Admin' ? 'Full access' : title]),
		};
	}

	checkRoles(values: TRoleAlias[], options: unknown, field: string): boolean {
		if (values.includes(TRoleAlias.Admin) && values.length > 1) {
			this.addError(field, 'invalidRole', this.__('`Admin` role cannot be combined with any other'));
		}

		return true;
	}

	async limitReached(values: string, options: unknown, field: string) {
		const limitNotReached = await this.getInstanceRegistry().getTariff().checkUsersLimit();
		if (!limitNotReached && !this.pk) {
			this.addError(field, 'limitReached', this.__('Limit for user creation is reached'));
		}

		return true;
	}
}