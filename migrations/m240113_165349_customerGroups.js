import BasicMigration from '../app/modules/migrate/components/basicMigration';
import {grantAccess} from '../app/modules/authorization/utils';

export default class Migration extends BasicMigration {
	constructor() {
		super();

		this.applyToSample = true;
		this.applyToWrapper = false;
		this.applyToInstances = true;
	}

	async up(db, type, instanceRegistry = null) {
		await db.sql('delete from customer_group');
		await db.sql(`
			alter table customer_group
				drop constraint if exists customer_group_price_id_fkey,
				drop column if exists price_id,
				add column if not exists title citext not null
		`);
		await db.sql('drop table if exists customer_group_text');

		await db.sql(`
			alter table person_profile
				drop constraint if exists person_profile_group_id_fkey,
				drop column if exists group_id
		`);

		await db.sql(`
			create table person_group_rel (
				person_id int not null,
				group_id int not null,
				primary key (person_id, group_id),
				foreign key (person_id) references person (person_id) on delete cascade on update cascade,
				foreign key (group_id) references customer_group (group_id) on delete cascade on update cascade
			)
		`);

		await db.sql(`
			create index on person_group_rel (group_id)
		`);

		await grantAccess(db, 'admin', 'customer:admin:group');

		await db.sql(`
			drop trigger if exists customer_group_after_insert on customer_group
		`);
		await db.sql(`
			drop function if exists customer_group_after_insert
		`);

		await db.sql(`
			insert into customer_group (alias, deleted_at, title)
			values ('vip-customers', null, 'VIP customers')
		`);

		await this.grantPrivileges(db, instanceRegistry);
	}
}