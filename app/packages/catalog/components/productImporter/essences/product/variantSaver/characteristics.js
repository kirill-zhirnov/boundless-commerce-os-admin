import ProductCharacteristics from '../productSaver/characteristics';

export default class VariantCharacteristics extends ProductCharacteristics {
	process() {
		return this.ensureCharacteristicsExists();
	}

	async processParam(item) {
		const characteristic = await this.findOrCreateCharacteristic(item);

		if (characteristic.isMultiValue()) {
			await this.processCharacteristicCase(characteristic, item);
		}
	}
}