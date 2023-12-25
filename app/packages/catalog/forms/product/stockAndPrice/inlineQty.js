import BasicStockAndPrice from '../stockAndPrice';
import _ from 'underscore';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

/**
 * Stock for inline variants:
 */
export default class VariantInlineQty extends BasicStockAndPrice {
	constructor(options) {
		super(options);

		this.stock = null;
	}

	getRules() {
		return [
			['qty', 'validateQty']
		];
	}

	async save() {
		await this.saveQty();

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			//@ts-ignore
			this.record.product_id
		);
	}

	async saveQty() {
		if (!this.trackInventory) return;

		//@ts-ignore
		const movement = await this.getModel('inventoryMovement').createByReason(
			'systemChangeQty',
			'editProductForm',
			this.getUser().getId()
		);

		await this.saveLocationQty(movement);
		//@ts-ignore
		await this.getModel('inventoryMovement').destroyIfEmpty(movement.movement_id);

		//@ts-ignore
		await this.record.inventoryItem.reload();
		//@ts-ignore
		this.stock = _.pick(this.record.inventoryItem, ['available_qty', 'reserved_qty']);
	}

	async setup() {
		await this.setupAttrs();

		//@ts-ignore
		this.inventoryItem = this.record.inventoryItem;

		//@ts-ignore
		await this.getModel('warehouse').checkWarehouseExists(
			this.getI18n(),
			this.getEditingLang().lang_id
		);
		await this.loadTrackInventory();
		await this.loadLocations();
		await this.loadStockValues();
	}

	async loadRecord() {
		//@ts-ignore
		return await this.getModel('variant').findException({
			include: [
				{
					model: this.getModel('inventoryItem')
				}
			],
			where: {
				variant_id: this.pk
			}
		});
	}

	getStock() {
		return this.stock;
	}
}