import {IServerRouter} from '../router/serverRouter';
import {IInstanceConfig} from '../config';
import Settings from '../../packages/system/modules/settings';
import ExtendedSequelize from '../../modules/db/sequelize';
import {IInstanceInfo} from '../../modules/instances';
import {ITariffModule} from '../tariff';
import {ICurrency} from '../system';
import {IServerCache} from '../cache';
import {IQueueEventPublisher} from '../rabbitMq';

export interface IInstanceRegistry {
	getRouter: () => IServerRouter;
	getConfig: () => IInstanceConfig;
	getSettings: () => Settings;
	getDb: () => ExtendedSequelize;
	getMediaUrl: (relativePath: string) => string;
	getInstanceInfo: () => IInstanceInfo;
	getTariff: () => ITariffModule;
	getCurrency: () => ICurrency;
	getDataPath: () => string;
	getMediaPath: () => string;
	getCache: () => IServerCache;
	getEventPublisher: () => IQueueEventPublisher;
	setInstanceInfo: (info : IInstanceInfo) => IInstanceRegistry
}