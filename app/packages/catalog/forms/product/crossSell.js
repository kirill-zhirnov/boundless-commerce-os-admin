import Form from '../../../../modules/form/index';
import _ from 'underscore';
import * as productEvents from '../../components/productEventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class CrossSell extends Form {
	constructor(options) {
		super(options);

		this.category = null;
		this.products = null;
	}

	getRules() {
		return [
			['rel_product', 'required'],
			['add_cross_relations', 'safe'],
		];
	}

	async save() {
		//@ts-ignore
		const {rel_product, add_cross_relations} = this.getSafeAttrs();

		const selectedProducts = _.pluck(this.products, 'product_id');
		const relatedProducts = Array.isArray(rel_product) ? rel_product : [];
		const allProducts = selectedProducts.concat(relatedProducts);

		const productsToChange = add_cross_relations == '1' ? allProducts : selectedProducts;
		const addRelProducts = add_cross_relations == '1' ? allProducts : relatedProducts;

		for (const productId of productsToChange) {
			await this.saveCrossSells(productId, addRelProducts);
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productsToChange
		);
	}

	async saveCrossSells(productId, relProducts) {
		for (let relProductId of relProducts) {
			relProductId = parseInt(relProductId);

			if (!relProductId || productId == relProductId)
				continue;

			//@ts-ignore
			await this.getModel('crossSell').setRelation(
				this.category.category_id,
				productId,
				relProductId
			);
		}
	}

	async setup() {
		//@ts-ignore
		this.category = await this.getModel('crossSellCategory').findException({
			where: {
				alias: this.getParam('category')
			}
		});

		this.products = await this.getModel('product').findAll({
			where: {
				product_id: this.getParam('product')
			}
		});

		if (!this.products.length)
			throw new Error('products not found');

		await super.setup();
	}

	async getTplData() {
		let out = await super.getTplData();

		//@ts-ignore
		out.category = this.category.toJSON();
		//@ts-ignore
		out.products = this.products;

		return out;
	}
}