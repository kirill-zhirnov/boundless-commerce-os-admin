import BasicGeneralMail from '../../../modules/mail/basicGeneralMail';

const SENDER_MAIL = 'kirill@boundless-commerce.com';

export default class FeedbackMails extends BasicGeneralMail {
	async sendRequestForFeedback(toEmail: string, isWix: boolean = false) {
		const html = await this.render(isWix ? 'requestForWix' : 'generalRequest', {}, 'layouts/email/empty');

		const mail = await this.getMail();

		mail.setSource(`Kirill Zhirnov <${SENDER_MAIL}>`);
		mail.setReplyTo(SENDER_MAIL);

		mail.addTo(toEmail);
		mail.setSubject('Do you need help?');
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}

	getSender(): string {
		return SENDER_MAIL;
	}

	getFileName(): string {
		return __filename;
	}
}