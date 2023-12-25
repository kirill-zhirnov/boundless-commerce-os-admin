import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import * as env from '../../../modules/env';

export default class BasicMigration {
	constructor() {
		this.applyToSample = true;
		this.applyToWrapper = true;
		this.applyToInstances = true;
		this.version = null;
	}

	setVersion(version) {
		this.version = version;
		return this;
	}

	getVersion() {
		return this.version;
	}

	shallApplyToSample() {
		return this.applyToSample;
	}

	shallApplyToWrapper() {
		return this.applyToWrapper;
	}

	shallApplyToInstances() {
		return this.applyToInstances;
	}

	async getDeliveryDb() {
		const packagesKit = wrapperRegistry.getPackagesKit();
		return packagesKit.get('delivery').getDeliveryDb();
	}

	getDeliveryViewConfig() {
		return wrapperRegistry.getConfig().deliveryViewDb;
	}

	getEnv(instanceRegistry) {
		return env.create(instanceRegistry).getEnv();
	}

	async grantPrivileges(db, instanceRegistry) {
		const dbUser = instanceRegistry ? instanceRegistry.getConfig().db.user : null;

		if (dbUser) {
			await db.sql(`grant all privileges on all tables in schema public to ${dbUser}`);
		  await db.sql(`grant all privileges on all sequences in schema public to ${dbUser}`);
		}
	}
}