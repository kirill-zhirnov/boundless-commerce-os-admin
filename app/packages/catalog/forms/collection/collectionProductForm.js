import Form from '../../../../modules/form/index';
import _ from 'underscore';
import * as productEvents from '../../components/productEventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class CollectionProductForm extends Form {
	constructor(options) {
		super(options);

		this.products = options.products;
	}

	getRules() {
		return [
			['collections, action', 'required'],
			['collections', 'inOptions', {options: 'collection', multiple: true}],
			['action', 'inOptions', {options: 'action'}]
		];
	}

	async getTplData() {
		const data = await super.getTplData();

		//@ts-ignore
		data.products = this.products;

		return data;
	}

	async save() {
		//@ts-ignore
		const {collections, action} = this.getSafeAttrs();

		if (!_.isArray(this.products) || !_.isArray(collections)) {
			throw new Error('One of the arguments is not an array.');
		}

		switch (action) {
			case 'add':
				await this.addToCollections(this.products, collections);
				break;
			case 'del':
				await this.deleteFromCollections(this.products, collections);
				break;
			default:
				throw new Error('Invalid action');
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.products
		);
	}

	async addToCollections(products, collections) {
		for (const collectionId of Array.from(collections)) {
			for (const productId of Array.from(products)) {
				//@ts-ignore
				await this.getModel('collectionProductRel').addOnce(collectionId, productId);
			}
		}
	}

	async deleteFromCollections(products, collections) {
		await this.getDb().sql(`
			delete from
				collection_product_rel
			where
				product_id in (:products)
				and collection_id in (:collections)
		`, {
			products,
			collections
		});
	}

	rawOptions() {
		return {
			//@ts-ignore
			collection: this.getModel('collection').fetchOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id),
			action: [['add'], ['del']]
		};
	}
}