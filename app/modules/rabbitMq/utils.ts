import {BrokerAsPromised, BrokerConfig} from 'rascal';
import {wrapperRegistry} from '../registry/server/classes/wrapper';

export function makeBrokerConfig(): BrokerConfig {
	const brokerConfig = Object.assign({}, require('../../config/rascal').default);
	Object.assign(brokerConfig.vhosts['/'].connection, wrapperRegistry.getConfig().rabbitMQ);

	return brokerConfig;
}

export async function makeBroker(): Promise<BrokerAsPromised> {
	return await BrokerAsPromised.create(makeBrokerConfig());
}