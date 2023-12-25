import BasicStockAndPrice from '../stockAndPrice';
import * as utils from '../../../../../modules/utils/server';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class BulkStock extends BasicStockAndPrice {
	//@ts-ignore
	getRules() {
		return [
			['qty', 'validateQty', {allowEmpty: true}],
			['available_qty', 'safe'],
		];
	}

	async save() {
		if (!Array.isArray(this.pk)) {
			this.addError('qty', 'noArr', 'pk is not an array');
			return Promise.reject();
		}

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		const movement = await this.getModel('inventoryMovement').createByReason(
			'systemChangeQty',
			'editProductForm',
			this.getUser().getId()
		);

		for (const bunch of utils.splitArr(this.pk, 50)) {
			const items = await this.getDb().sql(`
				select
					item_id,
					track_inventory
				from
					vw_inventory_item
				where
					product_id in (${this.getDb().escapeIn(bunch)})
					and type in ('product', 'variant')
					and lang_id = :lang
			`, {
				lang: this.getEditingLang().lang_id
			});

			//@ts-ignore
			if (attrs.available_qty) {
				const unTrackableItems = items
					//@ts-ignore
					.filter(el => !el.track_inventory)
					//@ts-ignore
					.map(el => el.item_id);
				await this.saveAvailability(unTrackableItems);
			}

			for (const row of items) {
				//@ts-ignore
				if (!row.track_inventory) continue;

				for (const location of this.locations) {
					const qty = attrs.qty[`l-${location.location_id}`];

					if (qty !== null && qty !== '') {
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
							item: row.item_id,
							qty: qty
						});
					}
				}
			}
		}

		//notifies that the whole bunch is updated, but the stock in form could be empty
		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.pk
		);

		//@ts-ignore
		await this.getModel('inventoryMovement').destroyIfEmpty(movement.movement_id);
	}

	async setup() {
		//@ts-ignore
		await this.getModel('warehouse').checkWarehouseExists(
			this.getI18n(),
			this.getEditingLang().lang_id
		);

		// await this.loadSettings();
		await this.loadLocations();

		this.stockValues = {};
		for (const location of this.locations) {
			this.stockValues[location.location_id] = {
				available_qty: 0,
				reserved_qty: 0
			};
		}
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

	async saveAvailability(items) {
		//@ts-ignore
		const {available_qty} = this.getSafeAttrs();
		const qty = parseInt(available_qty) === 1 ? 1 : 0;
		//@ts-ignore
		await this.getModel('inventoryItem').updateItemsQty(items, qty);
	}
}