import CmsImageUploader from '../../../cms/forms/admin/imageUploader';

export default class ProductImageUploader extends CmsImageUploader {
	constructor(options) {
		super(options);

		this.productId = options.productId;
		this.essence = 'product';
	}

	async save() {
		for (const file of this.files) {
			const {imageId} = await this.getModel('image').createAndUploadImage(
				this.getInstanceRegistry(),
				this.getEditingSite().site_id,
				this.getEditingLang().lang_id,
				file.absolutePath, [this.essence]
			);

			await this.getModel('productImage').create({
				product_id: this.productId,
				image_id: imageId,
				is_default: false
			});
		}
	}
}