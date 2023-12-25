import BasicCommand from '../../../modules/commands/basic';
import CronMailer from '../modules/cronMailer';

export default class MailCommand extends BasicCommand {
	async actionSendAll() {
		const mailer = new CronMailer();
		await mailer.sendAll();
	}
}