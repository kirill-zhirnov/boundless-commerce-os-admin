import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export async function notifyOrderChanged(instanceRegistry: IInstanceRegistry, userId: number, orderIds: number | number[], diff: {[key: string]: any}) {
	const pkList = Array.isArray(orderIds) ? orderIds : [orderIds];

	const eventPublisher = instanceRegistry.getEventPublisher();
	const data = {
		model: 'orders',
		pkList,
		diff,
		userId
	};

	await eventPublisher.modelChanged(data);
}