import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';
import FrontEndUrls from '../../../modules/url/frontendUrls';

export default class CustomerRegisterMails extends BasicInstanceMail {
	async sendWelcomeEmail(email: string, pass: string, firstName: string = '', loginUrl: string|null = null) {
		if (loginUrl === null) {
			const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());
			loginUrl = await frontendUrls.getLoginUrl() as string;
		}

		const alias = 'customer.welcomeEmail';
		const data = {email, pass, firstName, loginUrl};

		const {html, subject} = await this.renderDbTemplate({
			alias, data
		});

		await this.emitMailEvent({
			alias,
			data,
			html,
			subject,
			recipients: [email]
		});
	}
}