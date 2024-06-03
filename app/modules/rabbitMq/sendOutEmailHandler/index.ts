import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {ISendOutEmailHandlerData} from '../../../@types/rabbitMq';
import {IMailSettings} from '../../../@types/settings';
import {IMailTransport} from '../../../@types/mail';
import InstanceSES from '../../mail/transport/awsSes';
import striptags from 'striptags';

export default class SendOutEmailHandler {
	constructor(
		protected instanceRegistry: IInstanceRegistry,
		protected data: ISendOutEmailHandlerData
	) {
	}

	async handle() {
		await this.sendAsEmail();
	}

	async sendAsEmail() {
		const mail = await this.getMail();

		if (this.data.subject) {
			mail.setSubject(this.data.subject);
		}

		mail.setBodyHtml(this.data.html.full);
		mail.setBodyText(this.createTextVersion(this.data.html.content));
		mail.addTo(this.data.recipients);
		await mail.send();
	}

	async sendAsHook() {

	}

	async getMail(): Promise<IMailTransport> {
		const {from, replyTo} = await this.getMailSettings();
		const mail = new InstanceSES();

		mail.setSource(from);
		mail.addReplyTo(replyTo);

		return mail;
	}

	async getMailSettings(): Promise<IMailSettings> {
		return await this.instanceRegistry.getSettings().get('mail', 'settings') as IMailSettings;
	}

	createTextVersion(html: string) {
		return striptags(html);
	}
}