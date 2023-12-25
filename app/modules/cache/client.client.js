import Registry from '../registry/basic.client';
import _ from 'underscore';

export default class ClientCache extends Registry {
	async load(key, fallback = null) {
		if (this.has(key))
			return this.get(key);

		if (!_.isFunction(fallback))
			return null;

		const data = await fallback();
		this.set(key, data);

		return data;
	}

	save(key, val) {
		this.set(key, val);

		return this;
	}
}