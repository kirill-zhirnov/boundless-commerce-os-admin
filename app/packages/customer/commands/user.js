import BasicCommand from '../../../modules/commands/basic';
import {bootstrapInstanceById} from '../../../modules/bootstrap/instance';

export default class UserCommand extends BasicCommand {
	async actionCreateAdmin() {
		const instanceId = this.getOption('instance');
		const email = this.getOption('email');
		const pass = this.getOption('pass');
		if (!instanceId || !email || !pass) {
			console.error('You should pass: --instance=<id> --email=<email> --pass=<pass>');
			return;
		}

		const instanceRegistry = await bootstrapInstanceById(Number(instanceId), true);
		const db = instanceRegistry.getDb();
		const rows = await db.sql('select * from person where email = :email', {
			email
		});

		if (rows.length > 0) {
			throw new Error(`User with email '${email}' already exists!`);
		}

		const [person] = await db.sql(`
			insert into person
				(site_id, email, registered_at)
			select
				site_id, :email, now()
			from
				site
			limit 1
			returning *
		`, {
			email
		});

		console.log(person);
		await db.model('personAuth').updatePass(person.person_id, pass);
		await db.model('role').setAdminRoles(person.person_id);

		console.log('Admin was successfully created.\n\n');
	}

	async actionDeleteUser() {
		const instanceId = this.getOption('instance');
		const email = this.getOption('email');

		if (!instanceId || !email) {
			console.error('You should pass: --instance=<id> --email=<email>');
			return;
		}

		const instanceRegistry = await bootstrapInstanceById(Number(instanceId), true, true);
		const db = instanceRegistry.getDb();
		await db.sql(`
			delete
			from
				person
			where
				email = :email
		`, {
			email
		});

		console.log('User was completely removed from database.\n\n');
	}

	async actionUpdatePass() {
		const instanceId = this.getOption('instance');
		const email = this.getOption('email');
		const pass = this.getOption('pass');
		if (!instanceId || !email || !pass) {
			console.error('You should pass: --instance=<id> --email=<email> --pass=<pass>');
			return;
		}

		const instanceRegistry = await bootstrapInstanceById(Number(instanceId), true);
		const db = instanceRegistry.getDb();

		const [person] = await db.sql(`
			select
				*
			from
				person
			where
				email = :email
		`, {
			email
		});

		if (!person) throw new Error(`User with email '${email}' not found!`);

		await db.model('personAuth').updatePass(person.person_id, pass);
		await db.model('person').update({
			deleted_at: null
		}, {
			where: {
				person_id: person.person_id
			}
		});

		console.log('Password was updated and user activated.\n');
	}
}