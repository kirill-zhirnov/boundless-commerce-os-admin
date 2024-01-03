import BasicGeneralMail from '../../mail/basicGeneralMail';
import {IAuthConf} from '../components/starter';

export default class InstanceMails extends BasicGeneralMail {
	async sendInstanceCreated(toEmail: string, authConf: IAuthConf) {
		const urls = {
			backend: `${authConf.baseUrl}/admin/`,
			backendHref: authConf.authUrlAdmin
		};

		const html = await this.render('instanceCreated', {authConf, urls, email: toEmail});

		const mail = await this.getMail();
		mail.addTo(toEmail);
		mail.setSubject('Admin-side for your shop');
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}

	getFileName(): string {
		return __filename;
	}
}