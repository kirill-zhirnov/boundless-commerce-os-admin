import {IConfig} from '../../../../@types/config';
import ExtendedSequelize from '../../../db/sequelize';
import {createClient} from 'redis';
import JadeRenderer from '../../../viewRenderer/engine/jade';
import PackagesKit from '../../../packages/kit';
import ServerI18nKit from '../../../i18n/kit/server';
import Cache from '../../../cache/index';
import {Client as MemJsClient} from 'memjs';

export type RedisClient = ReturnType<typeof createClient>;

export class WrapperRegistry {
	protected config: IConfig;
	protected db: ExtendedSequelize;
	protected redis: RedisClient;
	protected redisMsg: RedisClient;
	protected redisMsgSend: RedisClient;
	protected view: JadeRenderer;
	protected packagesKit: PackagesKit;
	protected i18nKit: ServerI18nKit;
	protected generalCache: Cache;
	// protected clientLoader: string;
	protected memCache: MemJsClient;

	public setConfig(config: IConfig) {
		this.config = config;

		return this;
	}

	public getConfig(): IConfig {
		return this.config;
	}

	public setDb(db: ExtendedSequelize) {
		this.db = db;
		return this;
	}

	public getDb(): ExtendedSequelize {
		return this.db;
	}

	public hasDb(): boolean {
		return !!this.db;
	}

	public setRedis(redis: RedisClient) {
		this.redis = redis;
		return this;
	}

	public hasRedis(): boolean {
		return !!this.redis;
	}

	public getRedis(): RedisClient {
		return this.redis;
	}

	public setRedisMsg(redis: RedisClient) {
		this.redisMsg = redis;
		return this;
	}

	public getRedisMsg(): RedisClient {
		return this.redisMsg;
	}

	public hasRedisMsg(): boolean {
		return !!this.redisMsg;
	}

	public setRedisMsgSend(redis: RedisClient) {
		this.redisMsgSend = redis;
		return this;
	}

	public getRedisMsgSend(): RedisClient {
		return this.redisMsgSend;
	}

	public hasRedisMsgSend(): boolean {
		return !!this.redisMsgSend;
	}

	public setView(view: JadeRenderer) {
		this.view = view;
		return this;
	}

	public getView(): JadeRenderer
	{
		return this.view;
	}

	public setPackagesKit(kit: PackagesKit)
	{
		this.packagesKit = kit;
		return this;
	}

	public getPackagesKit(): PackagesKit
	{
		return this.packagesKit;
	}

	public setI18nKit(kit: ServerI18nKit)
	{
		this.i18nKit = kit;
		return this;
	}

	public getI18nKit(): ServerI18nKit
	{
		return this.i18nKit;
	}

	public setGeneralCache(cache: Cache) {
		this.generalCache = cache;
		return this;
	}

	public getGeneralCache(): Cache {
		return this.generalCache;
	}

	// public setClientLoader(clientLoader: string)
	// {
	// 	this.clientLoader = clientLoader;
	// 	return this;
	// }
	//
	// public getClientLoader(): string
	// {
	// 	return this.clientLoader;
	// }

	public isDebug(): boolean
	{
		return this.config.debug;
	}

	public getMemCache(): MemJsClient {
		if (!this.memCache) {
			this.memCache = MemJsClient.create(this.config.memcached.servers.join(','), {
				retries: 0
			});
		}

		return this.memCache;
	}

	public hasMemCache(): boolean {
		return !!this.memCache;
	}
}

export const wrapperRegistry = new WrapperRegistry();