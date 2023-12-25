import CmsImageUploader from '../../../../cms/forms/admin/imageUploader';
import {IImageModelStatic} from '../../../../cms/models/image';

export default class EmailLogoUploader extends CmsImageUploader {
	async save() {
		this.uploadedImages = [];
		for (const file of this.files) {
			const {cloudPath} = await (this.getModel('image') as IImageModelStatic).createAndUploadImage(
				this.getInstanceRegistry(),
				this.getEditingSite().site_id,
				this.getEditingLang().lang_id,
				file.absolutePath, [this.essence]
			);

			this.uploadedImages.push(cloudPath);

			const settings = await this.getSetting('mail', 'template') || {};

			await this.setSetting('mail', 'template', Object.assign(settings, {logo: cloudPath}));
		}
	}
}