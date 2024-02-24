import BasicCommand from '../../commands/basic';
import DbInstaller from '../components/dbInstaller';

export default class SystemCommand extends BasicCommand {
	async actionInstall() {
		const installer = new DbInstaller();
		await installer.install();

		console.log('\nDb is ready. Create your first store: ./shell.ts instance start --client=1 --email=mail@mail.com\n');
	}
}