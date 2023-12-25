import BasicAdmin from '../../../../system/controllers/admin';

export default class ProductCategoryController extends BasicAdmin {
	async actionTree() {
		const dataProvider = await this.createDataProvider(
			'@p-catalog/dataProvider/admin/product/categoryTree'
		);
		const data = await dataProvider.getData();

		this.json(data);
	}

	async actionGridFilters() {
		const dataProvider = await this.createDataProvider(
			'@p-catalog/dataProvider/admin/product/categoryTreeForFilter'
		);
		const data = await dataProvider.getData();

		this.json(data);
	}
}