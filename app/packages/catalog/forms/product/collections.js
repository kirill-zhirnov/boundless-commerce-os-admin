import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class ProductCollections extends Form {
	getRules() {
		return [
			['collection', 'inOptions', {options: 'collection', multiple: true}],
		];
	}

	async save() {
		//@ts-ignore
		await this.getModel('collectionProductRel').setProductCollections(
			//@ts-ignore
			this.record.product_id,
			this.getSafeAttr('collection')
		);
	}

	async setupAttrs() {
		if (!this.record)
			throw new Error('Record should be set by parent form in form group!');

		//@ts-ignore
		let collections = await this.getModel('collection').findCollectionsByProducts(
			//@ts-ignore
			[this.record.product_id],
			this.getEditingSite().site_id,
			this.getEditingLang().lang_id
		);

		let attrValue = _.pluck(collections[this.record.product_id], 'collection_id');
		if (this.record.status === 'draft' && !attrValue.length) {
			const mainPageCollection = await this.getModel('collection').findOne({
				where: {
					site_id: this.getEditingSite().site_id,
					lang_id: this.getEditingLang().lang_id,
					alias: 'main-page'
				}
			});

			if (mainPageCollection) {
				attrValue = [mainPageCollection.collection_id];
			}
		}

		this.setAttributes({
			//@ts-ignore
			collection: attrValue
		});
	}

	rawOptions() {
		return {
			//@ts-ignore
			collection: this.getModel('collection').fetchOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id)
		};
	}
}