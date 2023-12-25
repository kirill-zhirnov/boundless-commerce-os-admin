import {BrokerAsPromised, PublicationSession} from 'rascal';
import {
	IQueueEventData,
	IQueueEventPublisher,
	IQueueModelChangedData,
	IQueueModelRemovedData,
	TQueueEventType
} from '../../@types/rabbitMq';
import {makeBroker} from './utils';

const PUB_NAME = 'boundless_pub';
export default class QueueEventPublisher implements IQueueEventPublisher {
	protected broker: BrokerAsPromised;

	constructor(
		protected instanceId: number
	) {
	}

	async getBroker(): Promise<BrokerAsPromised> {
		if (!this.broker) {
			try {
				this.broker = await makeBroker();
			} catch (err) {
				console.log(err);
			}
		}

		return this.broker;
	}

	async publish(type: TQueueEventType, data: IQueueEventData): Promise<PublicationSession> {
		await this.getBroker();
		if (!this.broker) return;

		const publication = await this.broker.publish(
			PUB_NAME,
			{
				instanceId: this.instanceId,
				type,
				data
			});
		publication.on('error', console.error);

		return publication;
	}

	async modelChanged(data: IQueueModelChangedData) {
		return this.publish(TQueueEventType.updated, data);
	}

	async modelCreated(data: IQueueModelChangedData) {
		return this.publish(TQueueEventType.created, data);
	}

	async modelRemoved(data: IQueueModelRemovedData) {
		return this.publish(TQueueEventType.removed, data);
	}
}