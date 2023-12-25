import CmsImageUploader from '../../../cms/forms/admin/imageUploader';
import Uploader from '../../../cms/modules/uploader';
import fs from 'fs';
import path from 'path';
import InstanceS3Storage from '../../../../modules/s3Storage/instance';

export default class ImportUploader extends CmsImageUploader {
	constructor(options) {
		super(options);

		this.uploadedFile = null;
	}

	setupUploader() {
		this.uploader = new Uploader(this.controller, 'import');
		this.uploader.setValidExtensions(['csv', 'xls', 'xlsx', 'xml']);
	}

	async save() {
		const file = this.files[0];
		const extension = path.extname(file.fileName).slice(1);

		let type = extension;
		if (['xls', 'xlsx'].includes(extension)) {
			type = 'excel';
		} else if (extension === 'xml') {
			type = 'yml';
		}

		const s3Storage = new InstanceS3Storage(this.getInstanceRegistry());
		const cloudPath = await s3Storage.makeUniquePath('import', extension);
		await s3Storage.upload(fs.createReadStream(file.absolutePath), cloudPath, {contentType: file.mimeType});

		const fileInstance = await this.getDb().model('productImport').build().set({
			//@ts-ignore
			site_id: this.getEditingSite().site_id,
			lang_id: this.getEditingLang().lang_id,
			person_id: this.getUser().getId(),
			type,
			run: 'once',
			source_type: 'file',
			file_name: file.fileName,
			file_path: file.relativePath,
			cloud_path: cloudPath
		}).save();

		this.uploadedFile = fileInstance;
	}

	getUploadedFile() {
		return this.uploadedFile;
	}
}