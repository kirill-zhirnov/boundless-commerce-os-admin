import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {RedisClient} from '../../registry/server/classes/wrapper';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import _ from 'underscore';

export default class RedisCache {
	protected redis: RedisClient;

	constructor(
		protected instanceRegistry: IInstanceRegistry|null = null
	) {
		this.redis = wrapperRegistry.getRedis();
	}

	async save(key: string, data: any) {
		await this.redis.v4.set(this.getKey(key), JSON.stringify(data), {
			EX: 3600
		});
	}

	async load(key: string, fallback: () => any|Promise<any> = null): Promise<any> {
		const value = await this.redis.v4.get(this.getKey(key));

		if (value !== null) {
			return this.parseValue(value);
		}

		if (_.isFunction(fallback)) {
			const data = await fallback();
			await this.save(key, data);

			return data;
		}

		return null;
	}

	async remove(keys: string|string[]) {
		if (!Array.isArray(keys)) {
			keys = [keys];
		}

		const fullNameKeys = [];
		for (const item of keys) {
			fullNameKeys.push(this.getKey(item));
		}

		await this.redis.v4.del(fullNameKeys);
	}

	async clean() {
		const keys = await this.redis.v4.keys(`${this.getKeyPrefix()}*`);

		if (Array.isArray(keys)) {
			await this.redis.v4.del(keys);
		}
	}

	async	clearByPattern(pattern: string) {
		pattern = this.getKey(pattern);

		const luaScript = `local keys = redis.call('keys', ARGV[1])
if table.getn(keys) > 0 then
	return redis.call('del', unpack(keys))
end`;

		await this.redis.v4.eval(luaScript, {
			keys: ['0'],
			arguments: [pattern]
		});
	}

	parseValue(value: any): any {
		try {
			return JSON.parse(value);
		} catch (e) {
			console.error('cannot parse redis value:', e, value);
		}
	}

	getKey(key: string): string {
		return `${this.getKeyPrefix()}${key}`;
	}

	getKeyPrefix(): string {
		if (this.instanceRegistry) {
			return `i${this.instanceRegistry.getInstanceInfo().instance_id}-`;
		}

		return 'General-';
	}
}