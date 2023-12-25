import BasicForm from '../../../../modules/form';
import Uploader from '../../modules/uploader';
import * as thumbnailUrl from '../../modules/thumbnail/url';
import * as img from '../../modules/img';

export default class ImageUploaderForm extends BasicForm {
	constructor(options) {
		super(options);

		this.essence = options.essence;
		this.createThumbnailsClb = options.createThumbnailsClb;

		this.uploader = null;
		this.setupUploader();

		this.uploadedImages = [];
		this.files = [];
		this.maxImgQty = null;
	}

	setupUploader() {
		this.uploader = new Uploader(this.controller, 'images');
		this.uploader.setValidExtensions(['jpg', 'jpeg', 'png', 'gif']);
	}

	getRules() {
		return [
			['file', 'validateFile'],
		];
	}

	async save() {
		this.uploadedImages = [];

		let i = 0;
		for (const file of this.files) {
			if ((this.maxImgQty != null) && (i >= this.maxImgQty)) {
				return;
			}

			i++;
			const result = await img.identify(file.absolutePath);
			const row = await this.saveImgInDb({
				name: file.fileName,
				size: file.stat.size,
				path: file.relativePath,
				mimeType: file.mimeType,
				width: result.width,
				height: result.height
			});
			this.uploadedImages.push(row);
		}
	}

	createThumbnails(row) {
		if (this.createThumbnailsClb && typeof (this.createThumbnailsClb) === 'function') {
			return this.createThumbnailsClb.call(this, row);
		}

		return {
			smallThumb: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'xs'),
			bigThumb: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'm'),
			original: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'original'),
			largeThumb: thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'l')
		};
	}

	async validateFile() {
		const result = await this.uploader.process();

		if (result.errors.length > 0) {
			for (const error of result.errors) {
				this.addError('file', error.code, error.text);
				break;
			}
		} else {
			this.files = result.files;
		}
	}

	getUploadedImages() {
		return this.uploadedImages;
	}

	async saveImgInDb({name, size, path, mimeType, width, height}) {
		let usedIn = 'null';
		if (this.essence) {
			usedIn = `'{"${this.essence}"}'`;
		}

		const [row] = await this.getDb().sql(`\
insert into image \
(name, size, path, used_in, mime_type, site_id, lang_id, width, height) \
values \
(:name, :size, :path, ${usedIn}, :mimeType, :siteId, :langId, :width, :height) \
RETURNING *\
`, {
			name, size, path, mimeType,
			siteId: this.getEditingSite().site_id,
			langId: this.getEditingLang().lang_id,
			width,
			height
		});

		Object.assign(row, this.createThumbnails(row));

		return row;
	}
}
