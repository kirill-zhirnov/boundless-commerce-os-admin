import BasicDeliveryForm from './basicDelivery';

export default class SelfPickup extends BasicDeliveryForm {
	constructor(options) {
		super(options);

		this.shipping = null;
		this.shippingAlias = 'selfPickup';
	}

	getRules() {
		return [
			['title', 'required'],
			['title', 'validateShippingNotExists'],
			['sort', 'isNum'],
			['address', 'required'],
		];
	}

	getDefaultAttrs() {
		return {
			title: this.shipping.title
		};
	}

	async setupAttrsByRecord() {
		await super.setupAttrsByRecord();

		if (!this.attributes.title) {
			this.attributes.title = this.__('Self pickup');
		}

		if (this.record.shipping_config) {
			this.attributes.address = this.record.shipping_config.address;
		}
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const deliveryId = await this.useShipping(this.shippingAlias, 'byShippingService', {
			address: attrs.address
		});

		await this.saveDeliverySite(deliveryId, attrs.sort);
		await this.saveDeliveryText(deliveryId, attrs.title);
	}
}