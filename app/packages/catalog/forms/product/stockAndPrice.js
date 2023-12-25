import Form from '../../../../modules/form/index';
import validator from '../../../../modules/validator/validator';
import _ from 'underscore';

export default class StockAndPrice extends Form {
	constructor(options) {
		super(options);

		this.inventoryItem = null;
		this.prices = null;
		this.locations = null;

		this.priceValues = null;
		this.stockValues = null;
		this.trackInventory = null;

		this.globalErrAttr = 'sku';
	}

	getRules() {
		return [
			['price', 'validatePrice'],
			['qty', 'validateQty'],
			['available_qty', 'validateAvailability']
		];
	}

	async setup() {
		await super.setup();

		//@ts-ignore
		await this.getModel('warehouse').checkWarehouseExists(this.getI18n(), this.getEditingLang().lang_id);
		await this.loadInventoryItem();
		await this.loadTrackInventory();
		await this.loadPrices();
		await this.loadLocations();
		await this.loadPriceValues();
		await this.loadStockValues();
	}

	async save() {
		await this.savePrices();

		if (!this.trackInventory) {
			await this.saveAvailability();
		} else {
			await this.saveQty();
		}
	}

	async savePrices() {
		const currencyId = this.getInstanceRegistry().getCurrency().currency_id;
		//@ts-ignore
		const {price} = this.getSafeAttrs();

		if (!_.isObject(price))
			return;

		for (const {price_id} of this.prices) {
			const priceValue = price[`p-${price_id}`];
			const oldValue = price[`p-${price_id}_old`] || null;

			//@ts-ignore
			await this.getModel('inventoryItem').setPrice(
				this.inventoryItem.item_id,
				price_id,
				currencyId,
				priceValue,
				oldValue
			);
		}
	}

	async saveLocationQty(movement) {
		const attrs = this.getSafeAttrs();

		for (const {location_id} of this.locations) {
			await this.getDb().sql(`
			select inventory_change_available_qty(
				:movement,
				:location,
				:item,
				:qty
			)
		`, {
				movement: movement.movement_id,
				location: location_id,
				item: this.inventoryItem.item_id,
				//@ts-ignore
				qty: attrs.qty[`l-${location_id}`]
			});
		}
	}

	async saveQty() {
		//@ts-ignore
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
	}

	async saveAvailability() {
		//@ts-ignore
		const {available_qty} = this.getSafeAttrs();
		const qty = parseInt(available_qty) === 1 ? 1 : 0;
		//@ts-ignore
		await this.getModel('inventoryItem').updateItemsQty([this.inventoryItem.item_id], qty);
	}

	async getTplData() {
		const out = await super.getTplData();

		Object.assign(out, {
			prices: this.prices,
			locations: this.locations,
			priceValues: this.priceValues,
			stockValues: this.stockValues,
			trackInventory: this.trackInventory
		});

		let availableQty = 0;
		if (this.trackInventory) {
			Object.keys(this.stockValues).forEach((locationId) => {
				availableQty += this.stockValues[locationId].available_qty;
			});
		} else {
			availableQty = this.inventoryItem.available_qty || 0;
		}

		if (this.record && this.record.status === 'draft' && availableQty === 0) {
			availableQty = 1;
		}

		Object.assign(out, {availableQty});

		return out;
	}

	loadInventoryItem() {
		throw new Error('loadInventoryItem must be redefined!');
	}

	validatePrice(value, options, attr) {
		if (!_.isObject(value)) {
			return;
		}

		this.prices.forEach((priceRow) => {
			if (_.isUndefined(value[`p-${priceRow.price_id}`])) {
				this.addError(this.globalErrAttr, 'noValue', `Price for p-${priceRow.price_id} is undefined.`);
				return;
			}

			let priceValue = this.validatePriceValue(attr, `p-${priceRow.price_id}`);

			if (!priceRow.has_old_price)
				return;

			let oldSuffix = `p-${priceRow.price_id}_old`,
				oldValue = this.validatePriceValue(attr, oldSuffix)
				;

			if (oldValue && !priceValue) {
				this.addError(`${attr}[${oldSuffix}]`, 'noCurValue', this.__('Cannot set a Compare-at price without current price'));
				return;
			}
		});
	}

	validateQty(value, options, attr) {
		if (!this.trackInventory) return;

		let clearedVal = {};

		_.defaults(options, {
			allowEmpty: false
		});

		this.locations.forEach((location) => {
			let inputValue = null,
				suffix = `l-${location.location_id}`,
				inputName = `${attr}[${suffix}]`
				;

			if (_.isObject(value) && !_.isUndefined(value[suffix])) {
				inputValue = validator.trim(value[suffix]);

				if (inputValue != '' || !options.allowEmpty) {
					if (!validator.isNumeric(inputValue)) {
						this.addError(inputName, 'notNumeric', this.__('String should contain only numbers.'));
						return;
					}

					inputValue = parseInt(inputValue);
					if (inputValue < 0) {
						this.addError(inputName, 'lessZero', this.__('Quantity cannot be less than 0.'));
						return;
					}
				} else if (inputValue == '') {
					inputValue = null;
				}
			}

			clearedVal[suffix] = inputValue;
		});

		this.attributes[attr] = clearedVal;
	}

	validatePriceValue(attr, suffix) {
		let inputName = `${attr}[${suffix}]`,
			priceValue = validator.trim(this.attributes[attr][suffix])
			;

		if (priceValue != '') {
			let validationResult = validator.isDotNumeric(priceValue);

			if (validationResult === false) {
				this.addError(inputName, 'notNumeric', this.__('String should contain only numbers.'));
				return false;
			}

			priceValue = validationResult;
			if (priceValue < 0) {
				this.addError(inputName, 'lessZero', this.__('Price cannot be less than 0.'));
				return false;
			}
		}

		this.attributes[attr][suffix] = priceValue;

		return priceValue;
	}

	async validateAvailability(value, options, field) {
		// if (!this.trackInventory && !value) {
		// 	this.addError(field, 'required', this.__('Value cannot be blank.'));
		// }
	}

	async loadPrices() {
		this.prices = await this.getModel('price')
			//@ts-ignore
			.loadAllPrices(this.getEditingLang().lang_id)
			;
	}

	async loadLocations() {
		//@ts-ignore
		this.locations = await this.getModel('inventoryLocation').loadAllLocations(this.getEditingLang().lang_id);
	}

	async loadPriceValues() {
		let rows = await this.getModel('inventoryPrice').findAll({
			where: {
				item_id: this.inventoryItem.item_id
			}
		});

		this.priceValues = {};
		rows.forEach((row) => {
			//@ts-ignore
			this.priceValues[row.price_id] = row;
		});

		this.prices.forEach((price) => {
			if (!(price.price_id in this.priceValues))
				this.priceValues[price.price_id] = {};
		});
	}

	async loadStockValues() {
		//@ts-ignore
		this.stockValues = await this.getModel('inventoryStock').loadStockByInventoryItem(this.inventoryItem.item_id);

		this.locations.forEach((location) => {
			if (!this.stockValues[location.location_id])
				this.stockValues[location.location_id] = {
					available_qty: 0,
					reserved_qty: 0
				};
		});
	}

	async loadTrackInventory() {
		const [track] = await this.getDb().sql(`
			select
				track_inventory
			from
				vw_track_inventory
			where
				item_id = :itemId
		`, {itemId: this.inventoryItem.item_id});

		//@ts-ignore
		this.trackInventory = track.track_inventory;
	}
}