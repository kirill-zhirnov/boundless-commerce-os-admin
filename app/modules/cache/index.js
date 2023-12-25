import extend from 'extend';
import RedisCache from './providers/redis';

export default class Cache {
	constructor(config ={}, instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.config = extend(true, {
			provider: 'cacheStorage',
			backend: {
				type: 'file',
				config: {}
			}
		}, config);

		this.provider = null;
	}

//	first load takes a lot of time. Lets make it in bootstrap to don't waste
//	time when it needs
	async warmUp() {
		await this.load('_____warmUp');
	}

	load() {
		return this.applyProvider('load', arguments);
	}

	save() {
		return this.applyProvider('save', arguments);
	}

	remove(key) {
		return this.applyProvider('remove', arguments);
	}

	clean() {
		return this.applyProvider('clean', arguments);
	}

	clearByPattern() {
		return this.applyProvider('clearByPattern', arguments);
	}

	async applyProvider(method, callArgs) {
		const provider = await this.getProvider();
		const result = await provider[method].apply(provider, callArgs);

		return result;
	}

	async getProvider() {
		if (!this.provider) {
			await this.setupProvider();
		}

		return this.provider;
	}

	async setupProvider() {
		switch (this.config.provider) {
			case 'redis':
				this.provider = new RedisCache(this.instanceRegistry);
				break;

			default:
				throw new Error(`Unknown provider '${this.config.provider}'.`);
		}
	}
}