import outOfStockHandler from '../../modules/outOfStockHandler';

export default class AdminProductToBasket {
	constructor(controller, productId, orderId) {
		this.controller = controller;
		this.productId = productId;
		this.orderId = orderId;
		this.instanceRegistry = this.controller.getInstanceRegistry();
		this.db = this.instanceRegistry.getDb();
	}

	async makeProductResponse() {
		try {
			const product = await this.db.model('product').loadProductForBasket(this.instanceRegistry, this.productId, this.controller.getEditingSite().point_id);

			if (!product) {
				this.controller.alertDanger(this.controller.getI18n().__('Product not found!'));
				this.controller.json({result: false});
				return;
			} else if (product.variants > 0) {
				const params = {pk: product.product_id};

				if (this.orderId) {
					params.orderId = this.orderId;
				}

				// FIXME
				this.controller.modalRedirect(['catalog/admin/product/toBasketVariants', params]);
				return;
			}
			// else if (!product.price) {
			// 	this.controller.alertDanger(this.controller.getI18n().__('Product without price cannot be added to basket!'));
			// 	this.controller.json({result: false});
			// 	return;
			// }
			else {
				if (this.orderId) {
					throw new Error('Method was moved!');
					// await this.addItemToReserve(product);
					// this.controller.alertSuccess(this.controller.getI18n().__('Product was successfully reserved'));
				} else {
					let basicPrice = product.price_old || product.price;
					let finalPrice = product.price;

					await this.getBasket().addItem(product.item_id, 1, product.price_id, basicPrice, finalPrice);
					this.controller.alertSuccess(this.controller.getI18n().__('Product was successfully added to basket'));
				}
				this.controller.json({result: true});
			}
		} catch (e) {
			if (outOfStockHandler.isStockError(e)) {
				this.controller.json({result: false});
			}
			throw e;
		}
	}

	getBasket() {
		return this.controller.getClientRegistry().getBasket();
	}

	async addVariant(variantId) {
		try {
			const variant = await this.loadVariant(variantId);
			if (!variant) {
				throw new Error('Variant not found!');
			}

			if (this.orderId) {
				throw new Error('Method was moved');
				// await this.addItemToReserve(variant);
			} else {
				let basicPrice = variant.price_old || variant.price;
				let finalPrice = variant.price;

				await this.getBasket().addItem(variant.item_id, 1, variant.price_id, basicPrice, finalPrice);
			}
		} catch (e) {
			if (!outOfStockHandler.isStockError(e)) {
				throw e;
			}
		}
	}

	async loadVariant(variantId) {
		const [row] = await this.db.sql(`
			select
				v.variant_id,
				i.item_id,
				price.price_id,
				f.value as price,
				f.old as price_old
			from
				variant v
				inner join inventory_item i on i.variant_id = v.variant_id
				left join final_price f on f.item_id = i.item_id
				left join point_sale point on point.point_id = f.point_id
				left join price on price.price_id = f.price_id
			where
				v.variant_id = :variant
				and v.deleted_at is null
				and (point.site_id = :site or point.site_id is null)
				and (price.alias = :price or price.alias is null)
		`, {
			variant: variantId,
			site: this.controller.getClientRegistry().getEditingSite().site_id,
			price: 'selling_price'
		});

		return row;
	}
}