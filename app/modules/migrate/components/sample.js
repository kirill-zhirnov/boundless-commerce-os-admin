import BasicMigration from '../app/modules/migrate/components/basicMigration';

export default class Migration extends BasicMigration {
	constructor() {
		super();

		this.applyToSample = true;
		this.applyToWrapper = false;
		this.applyToInstances = true;
	}

	async up(db, type, instanceRegistry = null) {

		await db.sql('select 1');
	}
}