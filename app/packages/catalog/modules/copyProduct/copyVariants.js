import Component from '../../../../modules/component';

export default class CopyVariants extends Component {
	constructor(env, originalProduct, newProduct) {
		super(env);

		this.originalProduct = originalProduct;
		this.newProduct = newProduct;

		//copy characteristics and cases, which related to product (not to a group) and save
		//it in mapping:
		this.characteristicsMap = {};
		this.casesMap = {};
	}

	async process() {
		await this.copyProductCharacteristics();
		await this.copyVariants();
	}

	async copyVariants() {
		let rows = await this.getDb().sql(`
			select
				*
			from
				variant
				inner join variant_text using(variant_id)
			where
				product_id = :originalProductId
		`, {
			originalProductId: this.originalProduct.product_id
		});

		for (let row of rows) {
			await this.copyVariant(row);
		}
	}

	async copyVariant(originalVariant) {
		let newVariant = await this.createVariant(originalVariant);
		await this.copyVariantCharacteristics(originalVariant, newVariant);

		let newInventoryItem = await this.getModel('inventoryItem').findOne({
			where: {
				variant_id: newVariant.variant_id
			}
		});

		await this.copyStock(originalVariant, newInventoryItem);
		await this.copyPrices(originalVariant, newInventoryItem);
	}

	async copyPrices(originalVariant, newInventoryItem) {
		await this.getDb().sql(`
			insert into inventory_price
				(item_id, price_id, value, currency_id, old)
			select
				:newInventoryId,
				price_id,
				value,
				currency_id,
				old
			from
				inventory_price
				inner join inventory_item using(item_id)
			where
				variant_id = :originalVariantId
		`, {
			newInventoryId: newInventoryItem.item_id,
			originalVariantId: originalVariant.variant_id
		});
	}

	async copyStock(originalVariant, newInventoryItem) {
		await this.getDb().sql(`
			insert into inventory_stock
				(location_id, item_id, supply_id, available_qty, reserved_qty)
			select
				inventory_stock.location_id,
				:newInventoryItem,
				inventory_stock.supply_id,
				inventory_stock.available_qty,
				0
			from
				inventory_stock
				inner join inventory_item using(item_id)
			where
				variant_id = :originalVariantId
		`, {
			newInventoryItem: newInventoryItem.item_id,
			originalVariantId: originalVariant.variant_id
		});
	}

	async createVariant(originalVariant) {
		let newVariant = await this.getModel('variant').create({
			product_id: this.newProduct.product_id,
			sku: originalVariant.sku,
			size: originalVariant.size
		});

		await this.getModel('variantText').update({
			title: originalVariant.title
		}, {
			where: {
				variant_id: newVariant.variant_id,
				lang_id: this.getEditingLang().lang_id
			}
		});

		return newVariant;
	}

	async copyVariantCharacteristics(originalVariant, newVariant) {
		let relCharacteristics = await this.getModel('characteristicVariantVal').findAll({
			where: {
				variant_id: originalVariant.variant_id,
				rel_type: 'variant'
			}
		});

		for (let row of relCharacteristics) {
			let relCharacteristicId = row.characteristic_id,
				relCaseId = row.case_id
			;

			if (relCharacteristicId in this.characteristicsMap) {
				relCharacteristicId = this.characteristicsMap[relCharacteristicId];
				relCaseId = this.casesMap[relCaseId];

				if (!relCaseId)
					throw new Error(`Cannot find case: ${row.case_id}, for: ${row.characteristic_id}, variant: ${originalVariant.variant_id}`);
			}

			await this.getModel('characteristicVariantVal').create({
				variant_id: newVariant.variant_id,
				characteristic_id: relCharacteristicId,
				case_id: relCaseId,
				rel_type: 'variant'
			});
		}
	}

	async copyProductCharacteristics() {
		let rows = await this.getDb().sql(`
			select
				characteristic_id,
				group_id
			from
				product_variant_characteristic
				inner join characteristic using(characteristic_id)
			where
				product_id = :product
				and rel_type = 'variant'
		`, {
			product: this.originalProduct.product_id
		});

		for (let row of rows) {
			let characteristicId = row.characteristic_id;
			if (!row.group_id) {
				let newCharact = await this.copyCharacteristic(row.characteristic_id);
				characteristicId = newCharact.characteristic_id;
			}

			await this.getModel('productVariantCharacteristic').create({
				product_id: this.newProduct.product_id,
				characteristic_id: characteristicId,
				rel_type: 'variant',
				sort: row.sort
			});
		}
	}

	async copyCharacteristic(characteristicId) {
		let rows = await this.getDb().sql(`
			select
				*
			from
				characteristic
				inner join characteristic_text using(characteristic_id)
			where
				characteristic_id = :id
				and lang_id = :lang
		`, {
			id: characteristicId,
			lang: this.getEditingLang().lang_id
		});

		if (!rows[0])
			throw new Error(`Cannot find characteristic with ID: ${characteristicId}`);

		let originalCharact = rows[0];
		let newCharact = await this.getModel('characteristic').createCharacteristic(
			originalCharact.group_id,
			originalCharact.parent_id,
			originalCharact.type,
			originalCharact.title,
			this.getEditingLang().lang_id
		);

		this.characteristicsMap[originalCharact.characteristic_id] = newCharact.characteristic_id;

		await this.copyCases(originalCharact.characteristic_id, newCharact.characteristic_id);

		return newCharact;
	}

	async copyCases(originalCharactId, newCharactId) {
		let rows = await this.getDb().sql(`
			select
				*
			from
				characteristic_type_case
				inner join characteristic_type_case_text using(case_id)
			where
				characteristic_id = :charact
				and lang_id = :lang
			order by
				sort asc
		`, {
			charact: originalCharactId,
			lang: this.getEditingLang().lang_id
		});

		for (let row of rows) {
			let newCase = await this.getModel('characteristic').createCase(
				newCharactId,
				this.getEditingLang().lang_id,
				row.title
			);

			this.casesMap[row.case_id] = newCase.case_id;
		}
	}
}