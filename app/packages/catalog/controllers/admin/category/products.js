import BasicAdmin from '../../../../system/controllers/admin';

export default class CategoryProductsController extends BasicAdmin {
	async actionCollection() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/product', {
			//@ts-ignore
			category: [this.getParam('category')]
		});

		dataProvider.setPerPage(36);
		const data = await dataProvider.getData();

		this.json(data);
	}

	actionSortModal() {
		let id = parseInt(this.getParam('id'));

		if (!id) {
			this.rejectHttpError(400, 'incorrect input params');
			return;
		}

		this.modal('sortModal', {categoryId: id}, this.__('Sort products'), null, {
			setSize: 'large'
		});
	}

	postActionSort() {
		let formKit = this.createFormKit('@p-catalog/forms/category/productsSort', {}, {
			successMsg: false
		});
		formKit.process();
	}

	async postActionResetSort() {
		await this.getModel('productCategoryRel').update({
			sort: null
		}, {
			where: {
				category_id: this.getParam('category')
			}
		});

		this.json({result: true});
	}
}