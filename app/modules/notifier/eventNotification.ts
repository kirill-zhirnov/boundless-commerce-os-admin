import {TQueueEventType} from '../../@types/rabbitMq';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';

export async function notifyEvent(model: string, instanceRegistry: IInstanceRegistry, userId: number, type: TQueueEventType, ids: number | string | string[] | number[]) {
	const pkList = Array.isArray(ids) ? ids.map(id => Number(id)) : [Number(ids)];

	const eventPublisher = instanceRegistry.getEventPublisher();
	const data = {
		model,
		pkList,
		userId,
	};

	await eventPublisher.publish(type, data);
}


export async function notifyCustomerEvent(instanceRegistry: IInstanceRegistry, userId: number, type: TQueueEventType, customerIds: number | string | string[] | number[]) {
	await notifyEvent('customer', instanceRegistry, userId, type, customerIds);
}

export async function notifyProductEvent(instanceRegistry: IInstanceRegistry, userId: number, type: TQueueEventType, customerIds: number | string | string[] | number[]) {
	await notifyEvent('product', instanceRegistry, userId, type, customerIds);
}

export async function notifyOrderEvent(instanceRegistry: IInstanceRegistry, userId: number, type: TQueueEventType, customerIds: number | string | string[] | number[]) {
	await notifyEvent('orders', instanceRegistry, userId, type, customerIds);
}