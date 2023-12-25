import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';
import FrontEndUrls from '../../../modules/url/frontendUrls';

export default class CustomerRegisterMails extends BasicInstanceMail {
	async sendWelcomeEmail(email: string, pass: string, firstName: string = '', loginUrl: string|null = null) {
		if (loginUrl === null) {
			const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());
			loginUrl = await frontendUrls.getLoginUrl() as string;
		}

		const html = await this.render('welcomeEmail', {email, pass, firstName, loginUrl});
		const mail = await this.getMail();

		mail.setSubject(this.frontController.getClientRegistry().getI18n().__('Welcome!'));
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		mail.addTo(email);

		await mail.send();
	}

	getFileName(): string {
		return __filename;
	}
}