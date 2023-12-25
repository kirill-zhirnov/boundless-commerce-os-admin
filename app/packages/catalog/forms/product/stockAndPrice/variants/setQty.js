import BasicStockAndPrice from '../../stockAndPrice';
import * as productEvents from '../../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../../@types/rabbitMq';

/**
 * Variants set prices
 */
export default class VariantsSetQty extends BasicStockAndPrice {
	constructor(options) {
		super(options);

		this.variants = null;
	}

	getRules() {
		return [
			['qty', 'validateQty'],
		];
	}

	async setup() {
		await this.loadVariants();
		//@ts-ignore
		await this.getModel('warehouse').checkWarehouseExists(
			this.getI18n(),
			this.getEditingLang().lang_id
		);

		await this.loadLocations();
		await this.loadTrackInventory();

		this.stockValues = {};
		for (let location of this.locations) {
			this.stockValues[location.location_id] = {
				available_qty: 0,
				reserved_qty: 0
			};
		}
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const productId = this.variants[0].product_id;

		if (!this.trackInventory)
			return;

		//@ts-ignore
		const movement = await this.getModel('inventoryMovement').createByReason(
			'systemChangeQty',
			'editProductForm',
			this.getUser().getId()
		);

		for (const variant of this.variants) {
			for (const location of this.locations) {
				await this.getDb().sql(`
					select inventory_change_available_qty(
						:movement,
						:location,
						:item,
						:qty
					)
				`, {
					movement: movement.movement_id,
					location: location.location_id,
					//@ts-ignore
					item: variant.inventoryItem.item_id,
					qty: attrs.qty[`l-${location.location_id}`]
				});
			}
		}

		//@ts-ignore
		await this.getModel('inventoryMovement').destroyIfEmpty(movement.movement_id);

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productId
		);
	}

	//async just for types compatibility
	async loadTrackInventory() {
		//@ts-ignore
		this.trackInventory = !this.variants[0]?.product?.commodityGroup?.not_track_inventory;
	}

	//@ts-ignore
	async getTplData() {
		const out = {
			locations: this.locations,
			pk: this.pk,
			stockValues: this.stockValues
		};

		return out;
	}

	async loadVariants() {
		if (!Array.isArray(this.pk))
			throw new Error('PK must be an Array');

		this.variants = await this.getModel('variant').findAll({
			include: [
				{model: this.getModel('inventoryItem')},
				{
					model: this.getModel('product'),
					include: [
						{model: this.getModel('commodityGroup')}
					]
				},
			],
			where: {
				variant_id: this.pk
			}
		});

		if (!this.variants.length) {
			throw new Error('Variants not found!');
		}
	}

	getVariants() {
		return this.variants;
	}
}