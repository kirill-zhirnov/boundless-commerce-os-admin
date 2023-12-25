import BasicAdminController from '../../../../system/controllers/admin';

export default class ProductImageController extends BasicAdminController {
	async actionList() {
		const productId = parseInt(this.getParam('product'));
		if (!productId) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		//@ts-ignore
		const images = await this.getModel('productImage').loadImages(
			this.getInstanceRegistry(),
			productId,
			this.getEditingLang().lang_id
		);

		this.json(images);
	}

	async postActionUpload() {
		const productId = parseInt(this.getParam('product'));
		if (!productId) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		//@ts-ignore
		const formKit = this.createFormKit('@p-catalog/forms/product/imageUploader', {
			productId
		});
		await formKit.process();
	}

	async postActionRm() {
		const productImageId = parseInt(this.getParam('pk'));

		if (productImageId) {
			//@ts-ignore
			await this.getModel('productImage').removeImage(productImageId, this.getInstanceRegistry());
		}

		this.json(true);
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/product/productImg', {}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal('form', {data}, this.__('Edit'));
		}
	}

	async postActionSaveSort() {
		const productId = parseInt(this.getParam('product'));
		if (!productId) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		//@ts-ignore
		await this.getModel('productImage').saveSort(productId, this.getParam('sort'));

		this.json({});
	}
}