import {BrokerAsPromised, SubscriberSessionAsPromised} from 'rascal';
import {makeBroker} from './utils';
import {
	IBaseQueueEventContent,
	IQueueEventContent,
	IQueueModelChangedData, ISendOutEmailHandlerData,
	TQueueEventType
} from '../../@types/rabbitMq';
import {bootstrapInstanceById} from '../bootstrap/instance';
import ClientNotifier from './clientNotifier';
import CmdHandler from './cmdHandler';
import {ICmdParameters} from '../../@types/cmdHandler';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import OrdersHandler from './modelHandler/orders';
import MailHandler from './mailHandler';
import {IMailEventHandlerData} from '../../@types/mailEventHandler';
import SendOutEmailHandler from './sendOutEmailHandler';

const SUB_NAME = 'boundless_sub';
export default class QueueEventSubscription {
	protected broker: BrokerAsPromised;
	protected subscription: SubscriberSessionAsPromised;

	async startListener() {
		this.broker = await makeBroker();
		this.subscription = await this.broker.subscribe(SUB_NAME);

		console.log(`Subscribed to ${SUB_NAME}`);

		this.subscription
			.on('message', async (message, content, ackOrNack) => {
				if (('instanceId' in content) && ('type' in content)) {
					try {
						await this.processMessage(content as IQueueEventContent);
					} catch (err) {
						console.error(err);
					}
				} else {
					console.error('Ignoring message without instanceId and type:', content);
				}

				ackOrNack();
			})
			.on('error', console.error);
	}

	async processMessage({instanceId, data, type}: IQueueEventContent) {
		console.log('process message:', {instanceId, data, type});
		const instanceRegistry = await bootstrapInstanceById(instanceId);

		switch (type) {
			case TQueueEventType.created:
			case TQueueEventType.updated:
			case TQueueEventType.removed:
			case TQueueEventType.archived:
			case TQueueEventType.restored:
			case TQueueEventType.importFinished:
			case TQueueEventType.sorted:
				await this.handleModelSpecificLogic(instanceRegistry, {data, type});
				await QueueEventSubscription.handleNotification(instanceRegistry, {data, type});
				break;
			case TQueueEventType.runCmd:
				await QueueEventSubscription.handleCmd({instanceId, data: data as ICmdParameters, type});
				break;
			case TQueueEventType.sendMail:
				await new MailHandler(instanceRegistry, data as IMailEventHandlerData).handle();
				break;
			case TQueueEventType.sendOutEmail:
				await new SendOutEmailHandler(instanceRegistry, data as ISendOutEmailHandlerData).handle();
				break;
			default:
				console.warn(`Event with unknown type ${type} provided. No handler. Skipping...`);
		}
	}

	private static async handleNotification(instanceRegistry: IInstanceRegistry, {data, type}: IBaseQueueEventContent) {
		const clientNotifier = new ClientNotifier(instanceRegistry, {data, type});
		await clientNotifier.initWebhooks();
		await clientNotifier.send();
	}

	private static async handleCmd(event: IQueueEventContent<ICmdParameters>) {
		await new CmdHandler(event).handle();
	}

	protected async handleModelSpecificLogic(instanceRegistry: IInstanceRegistry, {data, type}: IBaseQueueEventContent) {
		if (!data.model || !Array.isArray(data.pkList)) {
			return;
		}

		switch (data.model) {
			case 'orders': {
				const handler = new OrdersHandler(instanceRegistry, type, data as IQueueModelChangedData);
				await handler.handle();
				break;
			}
		}
	}
}
