import Form from '../../../../../modules/form';
import {Op} from 'sequelize';
import OrderItems from '../../../components/orderItems';
import outOfStockHandler from '../../../modules/outOfStockHandler';
import * as orderEvents from '../../../components/orderEventNotification';

export default class OrderAddItemsModal extends Form {
	constructor(options) {
		super(options);

		this.addedItemIds = [];
		this.addedItems = [];
	}

	getRules() {
		return [
			['items', 'validateItems'],
		];
	}

	async loadRecord() {
		//@ts-ignore
		return this.getModel('orders').findException({
			include: [
				{model: this.getModel('reserve')}
			],
			where: {
				order_id: this.pk,
				[Op.or]: [
					{publishing_status: 'published'},
					{
						[Op.and]: [
							{publishing_status: 'draft'},
							{created_by: this.getUser().getId()}
						]
					}
				],
			}
		});
	}

	async save() {
		//@ts-ignore
		if (this.record.isLocked()) {
			throw new Error('Order is locked. Cannot process.');
		}

		const items = this.getSafeAttr('items');

		if (!Array.isArray(items)) return;
		//@ts-ignore
		const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.pk);

		for (const row of items) {
			if (!row.product_id)
				continue;

			//@ts-ignore
			const product = await this.getModel('product').loadProduct(
				this.getInstanceRegistry(),
				row.product_id,
				this.getClientRegistry().getSite().point_id,
				this.getEditingLang().lang_id
			);

			if (!product || (product.has_variants && !Array.isArray(row.variants)))
				continue;

			if (product.has_variants) {
				for (const variantRow of row.variants) {
					const qty = parseInt(variantRow.qty) || 1;
					await this.addVariantToOrder(orderItems, variantRow.variant_id, qty);
				}
			} else {
				const qty = parseInt(row.qty) || 1;
				await this.addProductToOrder(orderItems, product, qty);
			}
		}

		if (this.addedItemIds.length > 0) {
			this.addedItems = await orderItems.getItems({item_id: this.addedItemIds});
		}

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			Number(this.pk),
			{items: await orderItems.getItems()}
		);
	}

	async addVariantToOrder(orderItems, variantId, qty) {
		try {
			const shallTrackInventory = await this.getSetting('inventory', 'trackInventory');

			//@ts-ignore
			const variant = await this.getModel('variant').loadVariant(
				variantId,
				this.getClientRegistry().getSite().point_id,
				this.getEditingLang().lang_id,
				shallTrackInventory
			);
			console.log('---- variantId:', variantId);
			console.log('---- variant:', variant);
			if (!variant) {
				return;
			}

			let basic_price = variant.price, final_price;

			if (variant.price_old) {
				basic_price = variant.price_old;
				final_price = variant.price;
			}

			const price = {
				price_id: variant.price_id,
				basic_price,
				final_price
			};
			console.log('--- adding variant, price:', price);
			await orderItems.addItem(variant.item_id, qty, price);

			this.addedItemIds.push(variant.item_id);
		} catch (e) {
			if (outOfStockHandler.isStockError(e)) {
				await outOfStockHandler.process(e, this.getController(), this.getEditingLang());
			} else {
				throw e;
			}
		}
	}

	async addProductToOrder(orderItems, product, qty) {
		try {
			let basic_price = product.price, final_price;

			if (product.price_old) {
				basic_price = product.price_old;
				final_price = product.price;
			}

			const price = {
				price_id: product.price_id,
				basic_price,
				final_price
			};
			console.log('--- adding product, price:', price);
			await orderItems.addItem(product.item_id, qty, price);

			this.addedItemIds.push(product.item_id);
		} catch (e) {
			if (outOfStockHandler.isStockError(e)) {
				await outOfStockHandler.process(e, this.getController(), this.getEditingLang());
			} else {
				throw e;
			}
		}
	}

	async setupAttrs() {
		if (!this.pk)
			throw new Error('Primary key is mandatory for adding items');

		return super.setupAttrs();
	}

	validateItems() {
		//@ts-ignore
		if (this.record.isLocked()) {
			this.addError('items', 'orderIsLocked', this.__('Order is locked: can\'t add an item.'));
			this.getController().alertDanger(this.__('Order is locked: can\'t add an item.'));
			return;
		}
	}

	rawOptions() {
		const site = this.getEditingSite();
		const lang = this.getEditingLang();

		return {
			//@ts-ignore
			collection: this.getModel('collection').findOptionsWithQty(site.site_id, lang.lang_id, [['', this.__('Collection')]]),
			//@ts-ignore
			label: this.getModel('label').findOptions(lang.lang_id, [['', this.__('Label')]]),
			stock: [
				['', this.__('In stock: all')],
				['in_stock', this.__('In stock only')],
			]
		};
	}
}