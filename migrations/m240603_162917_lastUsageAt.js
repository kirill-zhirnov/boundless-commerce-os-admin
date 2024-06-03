import BasicMigration from '../app/modules/migrate/components/basicMigration';

export default class Migration extends BasicMigration {
	constructor() {
		super();

		this.applyToSample = false;
		this.applyToWrapper = true;
		this.applyToInstances = false;
	}

	async up(db, type, instanceRegistry = null) {
		await db.sql('alter table instance add column last_usage_at timestamp with time zone null default null');
	}
}