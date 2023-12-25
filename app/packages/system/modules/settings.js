import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import {createHash} from 'crypto';

export default class Settings {
	constructor(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.db = this.instanceRegistry.getDb();
		this.cache = this.instanceRegistry.getCache();
	}

	async get(group, key) {
		const value = await this.cache.load(this.getCacheKey(group, key), async () => {
			const rows = await this.db.sql(`
				select
					value
				from
					setting
				where
					setting_group = ?
					and key = ?
			`, [group, key]);

			const out = rows.length === 0 ? null : rows[0].value;
			return out;
		});

		return value;
	}

	async set(group, key, value) {
		await this.db.sql(`
			update
				setting
			set
				value = ?
			where
				setting_group = ?
				and key = ?
		`, [JSON.stringify(value), group, key]);

		await this.cache.remove(this.getCacheKey(group, key));
		await this.clearPhpKey(this.getCachedPhpKey(group, key));
	}

	clearCache(group, key) {
		return this.cache.remove(this.getCacheKey(group, key));
	}

	getCacheKey(group, key) {
		return `setting_${group}_${key}`;
	}

	getCachedPhpKey(group, key) {
		const instanceInfo = this.instanceRegistry.getInstanceInfo();
		return `i${instanceInfo.instance_id}_settings_${group}_${key}`;
	}

	async clearPhpKey(key) {
		try {
			const hashedKey = createHash('md5').update(key).digest('hex');
			await wrapperRegistry.getMemCache().delete(hashedKey);
		} catch (e) {
			console.error('Error in settings.clearPhpKey:', e);
		}
	}
}