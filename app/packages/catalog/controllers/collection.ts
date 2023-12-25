import BasicController from '../../../modules/controller/basic';

export default class CollectionController extends BasicController {
	async actionProducts() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/productCollection', {
			collectionId: this.getParam('id'),
			collectionAlias: this.getParam('alias')
		});
		const data = await dataProvider.getData();

		this.json(data);
	}

	async actionRmProduct() {
		await this.getModel('collectionProductRel').destroy({
			where: {
				collection_id: this.getParam('pk'),
				product_id: this.getParam('product')
			}
		});

		this.json({});
	}
}