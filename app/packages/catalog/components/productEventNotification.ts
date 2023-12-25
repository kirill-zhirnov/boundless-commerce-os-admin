import {TQueueEventType} from '../../../@types/rabbitMq';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export async function notifyProductsEvent(instanceRegistry: IInstanceRegistry, userId: number, type: TQueueEventType, productIds: number | string | string[] | number[]) {
	const pkList = Array.isArray(productIds) ? productIds.map(id => Number(id)) : [Number(productIds)];

	const eventPublisher = instanceRegistry.getEventPublisher();
	const data = {
		model: 'product',
		pkList,
		userId,
	};

	await eventPublisher.publish(type, data);
}