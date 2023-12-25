import BasicAdmin from '../admin';

export default class SchemaOrgController extends BasicAdmin {
	postActionUploadOrgImg() {
		const formKit = this.createFormKit('@p-system/forms/schemaOrgImgUploader', {}, {
			beforeJson: (result, closeModal, formKit) => {
				//@ts-ignore
				result.json.images = formKit.form.images;
			}
		});
		return formKit.process();
	}

	async postActionRmOrgImg() {
		const semanticMarkup = await this.getSetting('cms', 'semanticMarkup');
		const index = this.getParam('index');

		if (Array.isArray(semanticMarkup.images) && index !== null && index in semanticMarkup.images) {
			semanticMarkup.images.splice(index, 1);
			await this.getInstanceRegistry().getSettings()
				.set('cms', 'semanticMarkup', semanticMarkup)
				;
		}

		const images = semanticMarkup.images.map((img) => this.getInstanceRegistry().getMediaUrl(img));
		this.json(images);
	}
}