import BasicCommand from '../../../modules/commands/basic';
import Creator from '../../../modules/migrate/components/creator';
import Applier from '../../../modules/migrate/components/applier';

export default class MigrateCommand extends BasicCommand {
	async actionCreate() {
		const creator = new Creator(this.getOption('name'));
		const info = await creator.create();
		console.log(`Migration was successfully created: ${info.fileName}`);
	}

	async actionApply() {
		const applier = new Applier;
		await applier.applyMigrations();
	}
}