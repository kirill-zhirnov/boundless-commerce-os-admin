import Form from '../../../modules/form/index';
import Uploader from '../../cms/modules/uploader';
import _ from 'underscore';

export default class SchemaOrgImgUploader extends Form {
	constructor(options) {
		super(options);

		this.uploader = null;
		this.images = [];
		this.mediaPublicPath = null;
	}

	getRules() {
		return [
			['file', 'fileByUploader', {uploader: this.uploader}]
		];
	}

	async setup() {
		await super.setup();

		this.mediaPublicPath = `${this.getInstanceRegistry().getMediaPath()}/public`;
		this.uploader = new Uploader(this.getController(), this.mediaPublicPath, {
			localPrefix: 'openGraph'
		});
		this.uploader.setValidExtensions(['jpg', 'jpeg', 'png', 'gif']);
	}

	async save() {
		const semanticMarkup = await this.getSetting('cms', 'semanticMarkup');
		_.defaults(semanticMarkup, {
			images: []
		});

		const files = this.uploader.getFiles();
		semanticMarkup.images.push(files[0].relativePath);
		await this.setSetting('cms', 'semanticMarkup', semanticMarkup);

		for (const img of semanticMarkup.images) {
			this.images.push(
				this.getInstanceRegistry().getMediaUrl(img)
			);
		}
	}
}