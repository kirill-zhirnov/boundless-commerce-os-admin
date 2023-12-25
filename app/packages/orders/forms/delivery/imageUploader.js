import CmsImageUploader from '../../../cms/forms/admin/imageUploader';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class DeliveryImageUploader extends CmsImageUploader {
	async getRecord() {
		this.record = await this.getModel('delivery').findException({
			where: {
				delivery_id: this.pk
			}
		});

		return this.record;
	}

	async save() {
		this.uploadedImages = [];

		for (const file of this.files) {
			const {cloudPath, width, height} = await this.getModel('image').createAndUploadImage(
				this.getInstanceRegistry(),
				this.getEditingSite().site_id,
				this.getEditingLang().lang_id,
				file.absolutePath, [this.essence]
			);

			const thumb = thumbnailUrl.getAttrs(this.getInstanceRegistry(), {
				path: cloudPath,
				width,
				height,
			}, 'scaled', 's');

			this.uploadedFileSrc = {
				www: thumb.src,
				path: cloudPath
			};

			this.record.img = cloudPath;
			await this.record.save();
		}
	}

	getUploadedFileSrc() {
		return this.uploadedFileSrc;
	}
}
