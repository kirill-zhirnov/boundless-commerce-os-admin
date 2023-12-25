import BasicAdmin from '../../../system/controllers/admin';

export default class ManufacturerImageController extends BasicAdmin {
	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/manufacturer/logo');
		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.widget('catalog.adminManufacturerLogo.@c', {data});
		}
	}

	async actionUpload() {
		const formKit = this.createFormKit('@p-catalog/forms/manufacturer/logoUploader', {
			manufacturerId: this.getParam('manufacturerId')
		}, {
			beforeJson(result, closeModal, formKit) {
				//@ts-ignore
				return result.json.uploadedData = formKit.form.getUploadedImages()[0];
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			throw new Error('Method only for post!');
		}
	}

	async actionRm() {
		await this.getModel('manufacturer').update({
			image_id: null
		}, {
			where: {
				manufacturer_id: this.getParam('id')
			}
		});

		this.alertSuccess(this.getI18n().__('Logo was successfully removed.'));
		this.json({});
	}
}