import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IMailEventHandlerData} from '../../../@types/mailEventHandler';
import PasswordRestoreMails from '../../../packages/auth/mails/passRestore';
import CustomerRegisterMails from '../../../packages/customer/mails/registerMails';

export default class MailHandler {
	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected data: IMailEventHandlerData
	) {
	}

	async handle() {
		switch (this.data.mail) {
			case 'welcomeEmail': {
				const mail = new CustomerRegisterMails(this.instanceRegistry);
				await mail.sendWelcomeEmail(
					this.data.options.email,
					this.data.options.pass,
					this.data.options.firstName,
					this.data.options.loginUrl,
				);
				break;
			}
			case 'restorePassword': {
				const mail = new PasswordRestoreMails(this.instanceRegistry);
				await mail.sendPasswordRestoreEmail(
					this.data.options.username,
					this.data.options.email,
					null,
					this.data.options.restoreUrl
				);
				break;
			}
		}
	}
}