import {TQueueEventType} from '../../../../../@types/rabbitMq';
import Form from '../../../../../modules/form/index';
import validator from '../../../../../modules/validator/validator';
import * as productEvents from '../../../components/productEventNotification';

export default class InlineSellingPriceForm extends Form {
	getRules() {
		return [
			['price, old', 'validatePrice']
		];
	}

	async loadRecord() {
		//@ts-ignore
		return await this.getModel('variant').findException({
			include: [
				{model: this.getModel('inventoryItem')}
			],
			where: {
				variant_id: this.pk
			}
		});
	}

	async save() {
		const attrs = this.getSafeAttrs();

		if (attrs.price === null)
			return;

		//@ts-ignore
		const priceRow = await this.getModel('price').findException({
			where: {
				alias: 'selling_price'
			}
		});

		//@ts-ignore
		await this.getModel('inventoryItem').setPrice(
			//@ts-ignore
			this.record.inventoryItem.item_id,
			priceRow.price_id,
			this.getInstanceRegistry().getCurrency().currency_id,
			attrs.price,
			attrs.old
		);

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			//@ts-ignore
			this.record.product_id
		);
	}

	validatePrice(value, options, attr) {
		value = validator.trim(value);

		if (value != '') {
			let validationResult = validator.isDotNumeric(value);

			if (validationResult === false || validationResult < 0) {
				value = null;
			}
		} else {
			value = null;
		}

		if (attr == 'old' && !this.attributes['price']) {
			value = null;
		}

		this.attributes[attr] = value;
	}
}