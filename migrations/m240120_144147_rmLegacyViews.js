import BasicMigration from '../app/modules/migrate/components/basicMigration';

export default class Migration extends BasicMigration {
	constructor() {
		super();

		this.applyToSample = true;
		this.applyToWrapper = false;
		this.applyToInstances = true;
	}

	async up(db, type, instanceRegistry = null) {
		await db.sql('DROP MATERIALIZED VIEW IF EXISTS vw_shipping_city');
		await db.sql('DROP MATERIALIZED VIEW IF EXISTS vw_shipping_zip');
	}
}