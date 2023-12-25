import {INotificationMethod} from '../../../@types/clientNotifier';
import {IBaseQueueEventContent} from '../../../@types/rabbitMq';
import Webhook from './Webhook';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export default class ClientNotifier {
	private notificationMethods: INotificationMethod[] = []

	constructor(
		private readonly instanceRegistry: IInstanceRegistry,
		private readonly data: IBaseQueueEventContent
	) {}

	async initWebhooks(): Promise<void> {
		this.notificationMethods.push(
			...(await Webhook.getInstances(this.instanceRegistry, this.data))
		);
	}

	initEmail(): Promise<void> {
		// Implement email notifications
		return Promise.resolve();
	}

	async initAll() {
		await this.initWebhooks();
		await this.initEmail();
	}

	async send() {
		for (const method of this.notificationMethods) {
			await method.send();
		}
	}
}
