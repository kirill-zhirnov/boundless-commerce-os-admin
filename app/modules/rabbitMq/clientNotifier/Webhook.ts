import axios, {AxiosError} from 'axios';
import cryptoMd5 from 'crypto-md5';
import {INotificationMethod, IWebhook} from '../../../@types/clientNotifier';
import {IBaseQueueEventContent} from '../../../@types/rabbitMq';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export default class Webhook implements INotificationMethod {
	constructor(
		private readonly webhook: IWebhook,
		private readonly data: IBaseQueueEventContent,
		private readonly instanceRegistry: IInstanceRegistry
	) { }

	public static async getInstances(instanceRegistry: IInstanceRegistry, data: IBaseQueueEventContent): Promise<Webhook[]> {
		const webhooks: IWebhook[] = await instanceRegistry.getDb().sql('SELECT * FROM webhook');
		return webhooks.map((webhook) => new Webhook(webhook, data, instanceRegistry));
	}

	async send() {
		const signature = this.webhook.secret
			? cryptoMd5(`${this.webhook.secret}.${JSON.stringify(this.data)}`, 'hex')
			: undefined;
		let status: number = 0;
		try {
			const data = await axios({
				method: 'post',
				url: this.webhook.url,
				headers: signature ? {'boundless-checksum-md5': signature} : {},
				data: this.data,
				timeout: 1000 * 10
			});
			status = data.status;
		} catch (err) {
			if (err.response) status = (err as AxiosError).response.status;
			else console.error(`Can't send notification to webhook with id ${this.webhook.webhook_id} and url ${this.webhook.url} due to the error:`, err.message);
		}

		return this.saveResult(status);
	}

	private async saveResult(statusCode: number) {
		try {
			const result = await this.instanceRegistry.getDb().sql(
				'INSERT INTO webhook_log(webhook_id, status_code) VALUES (:webhook_id, :status_code)',
				{webhook_id: this.webhook.webhook_id, status_code: statusCode}
			);

			return result;
		} catch (err) {
			console.error(err);
		}
	}
}
