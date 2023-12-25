import BasicGeneralMail from '../../mail/basicGeneralMail';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import {IInstanceModel} from '../models/instance';
import {loadInstanceById} from '../../instances';
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

	async sendInstanceUnavailable(instanceId: number) {
		const instanceInfo = await loadInstanceById(instanceId);
		const instanceRow = await wrapperRegistry.getDb().model('instance').findOne({
			where: {
				instance_id: instanceId
			}
		}) as IInstanceModel;

		const html = await this.render('instanceUnavailable', {instanceInfo});

		const mail = await this.getMail();
		mail.addTo(instanceRow.client_email);
		mail.setSubject('Instance suspended');
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}

	async sendPaymentError(instanceId: number) {
		const instanceInfo = await loadInstanceById(instanceId);
		const instanceRow = await wrapperRegistry.getDb().model('instance').findOne({
			where: {
				instance_id: instanceId
			}
		}) as IInstanceModel;

		const html = await this.render('paymentError', {instanceInfo});

		const mail = await this.getMail();
		mail.addTo(instanceRow.client_email);
		mail.setSubject('Payment error');
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}

	async sendPaymentSuccess(instanceId: number, amount: number|string) {
		const instanceInfo = await loadInstanceById(instanceId);
		const instanceRow = await wrapperRegistry.getDb().model('instance').findOne({
			where: {
				instance_id: instanceId
			}
		}) as IInstanceModel;

		const html = await this.render('paymentSuccess', {instanceInfo, amount, instanceRow});

		const mail = await this.getMail();
		mail.addTo(instanceRow.client_email);
		mail.setSubject('Thank you for your payment!');
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}
	getFileName(): string {
		return __filename;
	}
}