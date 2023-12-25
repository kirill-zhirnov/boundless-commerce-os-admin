import BasicAdmin from '../../../../system/controllers/admin';

export default class CategoryTreeController extends BasicAdmin {
	async actionParent() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/category/parentTree');

		this.json(
			//@ts-ignore
			await dataProvider.getJsTree()
		);
	}

	async actionLinks() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/category/linkTree');

		this.json(
			//@ts-ignore
			await dataProvider.getJsTree()
		);
	}
}