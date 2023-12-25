import Downloader from '../../cms/modules/downloader';
import ImporterBasic from './importerBasic';
import fs from 'fs';
import {promisify} from 'util';

const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export default class ProductImageImporter extends ImporterBasic {
	constructor(instanceRegistry, importRow = null) {
		super(instanceRegistry, importRow);

		this.uploadedSize = 0;
		this.imagesUploaded = 0;
		this.imagesSkipped = 0;
	}

	async process(rows) {
		for (const row of Array.from(rows)) {
			await this.processRow(row);
		}
	}

	async processRow(importImageData) {
		let fileInfo = null;
		try {
			fileInfo = await this.downloadFile(importImageData.url);
			const {size} = await stat(fileInfo.absolutePath);
			const uploadAllowed = await this.instanceRegistry.getTariff().checkStorageLimit({
				fileSize: this.uploadedSize + size,
				forceRefresh: !this.uploadedSize
			});
			if (uploadAllowed) {
				await this.saveImage(importImageData, fileInfo);
				await this.logStatus(importImageData, 'downloaded');
				this.uploadedSize += size;
				this.imagesUploaded ++;
			} else {
				this.imagesSkipped++;
				await unlink(fileInfo.absolutePath);
				await this.logStatus(importImageData, 'error', 'Skipped due to tariff limit');
			}
		} catch (e) {
			if (fileInfo && fs.existsSync(fileInfo.absolutePath)) {
				await unlink(fileInfo.absolutePath);
			}
			await this.logStatus(importImageData, 'error', e.message);
		}
	}

	async saveImage(importImageData, fileInfo) {
		const {imageId} = await this.db.model('image').createAndUploadImage(
			this.instanceRegistry,
			importImageData.site_id,
			importImageData.lang_id,
			fileInfo.absolutePath, ['product']
		);
		await this.db.model('productImage').create({
			product_id: importImageData.product_id,
			image_id: imageId,
			is_default: false,
			source_url: this.db.model('productImage').prepareSourceUrl(importImageData.url)
		});
	}

	downloadFile(url) {
		const downloader = new Downloader(this.instanceRegistry, 'import', {
			sizeLimit: 5e6,
			contentType: [
				'image/png',
				'image/jpeg'
			]
		});

		return downloader.downloadFile(url);
	}

	async loadImportRow() {
		const rows = await this.db.sql(`
			select
				product_import_imgs.import_img_id,
				product_import.import_id,
				product_import.site_id,
				product_import.lang_id,
				product_import_imgs.url,
				product_import_imgs.product_id
			from
				product_import
			inner join product_import_imgs using(import_id)
			where
				import_id = :id
				and status = 'new'
		`, {
			id: this.importId
		});
		this.setImportRow(rows);
		return rows;
	}

	getImportStats() {
		return {
			skipped: this.imagesSkipped,
			uploaded: this.imagesUploaded
		};
	}

	async logStatus(importImageData, status, message = null) {
		if (message) {
			message = String(message).substr(0, 499);
		}

		await this.db.model('productImportImgs').update({
			status,
			reason: message
		}, {
			where: {
				import_img_id: importImageData.import_img_id
			}
		});
	}
}