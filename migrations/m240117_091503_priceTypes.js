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
		await db.sql('alter table price add column is_public boolean not null default false');
		await db.sql('update price set is_public = true where alias = :alias', {alias: 'selling_price'});

		await db.sql(`
			create table price_group_rel (
				price_id int not null,
				group_id int not null,
				primary key (price_id, group_id),
				foreign key (price_id) references price (price_id) on delete cascade on update cascade,
				foreign key (group_id) references customer_group (group_id) on delete cascade on update cascade
			)
		`);
		await db.sql(`
			create index on price_group_rel (group_id)
		`);

		await grantAccess(db, 'admin', 'catalog:admin:prices');

		await this.grantPrivileges(db, instanceRegistry);
	}
}