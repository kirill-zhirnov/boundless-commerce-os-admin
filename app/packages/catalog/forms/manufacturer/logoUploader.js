import CmsImageUploader from '../../../cms/forms/admin/imageUploader';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class ManufacturerLogoUploader extends CmsImageUploader {
	constructor(options) {
		super(options);

		this.manufacturerId = options.manufacturerId;
		this.essence = 'manufacturer';
	}

	async save() {
		this.uploadedImages = [];
		for (const file of this.files) {
			const {imageId, cloudPath, width, height} = await this.getModel('image').createAndUploadImage(
				this.getInstanceRegistry(),
				this.getEditingSite().site_id,
				this.getEditingLang().lang_id,
				file.absolutePath, [this.essence]
			);

			this.uploadedImages.push(this.createThumbnails({
				path: cloudPath,
				width,
				height,
			}));

			await this.getDb().sql('\
				update \
				manufacturer \
				set \
				image_id = :image \
				where \
				manufacturer_id = :manufacturerId\
			', {
				manufacturerId: this.manufacturerId,
				image: imageId
			});
		}
	}

	createThumbnails(row) {
		return {
			smallThumb: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 's'),
			bigThumb: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'm'),
			// original: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'original')
		};
	}
}