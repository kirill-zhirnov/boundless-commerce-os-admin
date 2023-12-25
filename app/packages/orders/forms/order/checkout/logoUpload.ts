import InstanceS3Storage from '../../../../../modules/s3Storage/instance';
import CmsImageUploader from '../../../../cms/forms/admin/imageUploader';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';

const unlink = promisify(fs.unlink);

export default class LogoUploadForm extends CmsImageUploader {
	protected uploadedFiles: string[];
	constructor(options) {
		super(options);

		this.uploadedFiles = [];
	}

	async save() {
		for (const file of this.files) {
			const s3Storage = new InstanceS3Storage(this.getInstanceRegistry());
			const extension = path.extname(file.absolutePath).substr(1);
			const cloudPath = await s3Storage.makeUniquePath('common', extension);
			await s3Storage.upload(fs.createReadStream(file.absolutePath), cloudPath, {contentType: file.mimeType});

			this.uploadedFiles.push(cloudPath);

			const settings = await this.getInstanceRegistry().getSettings().get('orders', 'checkoutPage');
			if (settings.logo) {
				await s3Storage.deleteImgWithThumbs(settings.logo);
			}

			await this.getInstanceRegistry().getSettings().set(
				'orders',
				'checkoutPage',
				Object.assign(settings || {}, {logo: cloudPath})
			);

			await unlink(file.absolutePath);
		}
	}

	getFilesForWeb() {
		return this.uploadedFiles;
	}
}