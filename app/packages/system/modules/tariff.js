// Mock for the Open-Source version
export default class Tariff {
	constructor(instanceRegistry, features, tariffAlias) {
		this.instanceRegistry = instanceRegistry;
		this.features = features;
		this.tariffAlias = tariffAlias;
	}

	checkFeatureAccess(featureAlias) {
		return true;
	}

	getLimitValue(featureAlias) {
		return this.features[featureAlias];
	}

	getAlias() {
		return this.tariffAlias;
	}

	getFeatures() {
		return this.features;
	}

	async checkProductLimit(options) {
		return true;
	}

	async checkStorageLimit(options = {}) {
		return true;
	}

	async checkUsersLimit() {
		return true;
	}
}