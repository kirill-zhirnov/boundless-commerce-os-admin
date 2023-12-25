import CmsImageUploader from '../../../cms/forms/admin/imageUploader';

export default class CategoryIconForm extends CmsImageUploader {
	constructor(options) {
		super(options);

		this.uploadedFiles = [];
		this.essence = 'category';
	}

	async save() {
		for (const file of this.files) {
			//@ts-ignore
			const {imageId, cloudPath, width, height} = await this.getModel('image').createAndUploadImage(
				this.getInstanceRegistry(),
				this.getEditingSite().site_id,
				this.getEditingLang().lang_id,
				file.absolutePath, [this.essence]
			);

			this.uploadedFiles.push({
				imageId,
				src: cloudPath,
				width,
				height
			});
		}
	}

	getFilesForWeb() {
		return this.uploadedFiles;
	}
}