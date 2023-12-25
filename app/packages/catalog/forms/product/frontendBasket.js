// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');

class FrontendBasket extends Form {
	initialize(options) {
		this.product = null;
//		FIXME: remove @varianta, should be only @tplVariants. Same for tpls. Dont have time to fix it.
		this.tplVariants = null;
		this.variants = [];
		this.trackInventory = null;

		this.selectedVariant = null;

//		Basket item after item is added to basket
		this.basketItem = null;

		this.qty = null;
		this.callToOrder = null;

		if (options.qty) {
			this.qty = Number(options.qty);
		}

		if (options.callToOrder) {
			this.callToOrder = Number(options.callToOrder);
		}

		return super.initialize(...arguments);
	}

	setup() {
		return super.setup(...arguments)
		.then(() => {
			return this.getInstanceRegistry().getSettings().get('inventory', 'trackInventory');
	}).then(value => {
			this.trackInventory = value;

			return this.getModel('product').loadProduct(this.getInstanceRegistry(), this.pk, this.getSite().point_id, this.getLang().lang_id);
		}).then(product => {
			this.product = product;

			return this.getModel('variant').loadVariantsForTpl(this.product.product_id, this.getSite().point_id, this.getLang().lang_id, this.trackInventory);
		}).then(result => {
			this.tplVariants = result;
			this.variants = result.variants;

		});
	}

	getRules() {
		return [
			['variant', 'required'],
			['variant', 'inOptions', {options: 'variant'}],
			['variant', 'validateVariant']
		];
	}

	save() {
		const basket = this.getClientRegistry().getBasket();
		return basket.addItem(this.selectedVariant.item_id, 1, this.selectedVariant.price_id, this.selectedVariant.price)
		.then(() => {
			return basket.getItem(this.selectedVariant.item_id, this.getLang().lang_id, this.getSite().point_id);
	}).then(item => {
			this.basketItem = item;

		});
	}

	validateVariant(value, options, field) {
		if (this.hasErrors(field)) {
			return true;
		}

		this.selectedVariant = null;
		for (let row of Array.from(this.variants)) {
			if (String(row.variant_id) === String(value)) {
				this.selectedVariant = row;
			}
		}

		if (!this.selectedVariant) {
			this.addError('variant', 'noVariant', this.getI18n().__('Variant not found'));
		}

		if (!this.selectedVariant.inStock) {
			this.addError('variant', 'outOfStock', this.getI18n().__('Out of stock'));
		}

		if (!this.selectedVariant.price) {
			this.addError('variant', 'noPrice', this.getI18n().__('This variant does not have price. It cannot be added to basket.'));
		}

		return true;
	}

	rawOptions() {
		return {
			variant : this.generateVariantOptions()
		};
	}

	generateVariantOptions() {
		const out = [];

//		we use it only for validation, so don't need to have title
		for (let variant of Array.from(this.variants)) {
			out.push([variant.variant_id, variant.variant_id]);
		}

		return out;
	}

	getTplData() {
		return super.getTplData(...arguments)
		.then(data => {
//			data.product = @product
//			data.variants = @variants
//			data.tplVariants = @tplVariants

			const extraParams = {};
			if (this.qty) {
				extraParams.qty = this.qty;
			}

			if ([0, 1].includes(this.callToOrder)) {
				extraParams.callToOrder = this.callToOrder;
			}

			return {
				product: this.product,
				data: Object.assign(this.tplVariants, {
					extraParams
				}),
			};
	});
	}

	getBasketItem() {
		return this.basketItem;
	}
}

module.exports = FrontendBasket;