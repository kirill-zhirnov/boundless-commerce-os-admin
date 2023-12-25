import {TQueueEventType} from '../../../../../@types/rabbitMq';
import Form from '../../../../../modules/form/index';
import * as productEvents from '../../../components/productEventNotification';

export default class VariantForm extends Form {
	getRules() {
		return [
			[
				'sku',
				'isUnique',
				{
					field: 'sku',
					row: this.record,
					criteria: {
						where: {
							//@ts-ignore
							product_id: this.record.product_id
						}
					}
				}
			]
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		//@ts-ignore
		this.record.sku = attrs.sku;
		await this.record.save();

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			//@ts-ignore
			this.record.product_id
		);
	}

	async setup() {
		if (!this.pk)
			throw new Error('Form is only for editing');

		return await super.setup();
	}

	setupAttrsByRecord() {
		let attrs = {
			//@ts-ignore
			sku: this.record.sku,
			//@ts-ignore
			title: this.record.variantTexts[0].title
		};

		this.setAttributes(attrs);
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('variant').findException({
			include: [{
				model: this.getModel('variantText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				variant_id: this.pk
			}
		});
	}

	onFormsGroupSaved() {
		//@ts-ignore
		return this.essenceChanged('product', this.pk);
	}

	setupChildFormKit(childFormKit) {
		childFormKit.setPk(this.pk);
		childFormKit.setOptions({
			record: this.record
		});

		return;
	}
}