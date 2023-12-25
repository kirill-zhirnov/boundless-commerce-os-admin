import Form from '../../../modules/form/index';
import Uploader from '../../cms/modules/uploader';

export default class OpenGraphImageUploader extends Form {
	constructor(options) {
		super(options);

		this.uploader = null;
		this.uploadedFileSrc = null;
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
		const files = this.uploader.getFiles();

		const data = await this.getInstanceRegistry().getSettings().get('cms', 'openGraph');
		data.img = this.getSrcFromFile(files[0]).path;
		await this.getInstanceRegistry().getSettings().set('cms', 'openGraph', data);
	}

	getSrcFromFile(file) {
		this.uploadedFileSrc = {
			www: this.getInstanceRegistry().getMediaUrl(file.relativePath),
			path: file.relativePath
		};

		return this.uploadedFileSrc;
	}

	getUploadedFileSrc() {
		return this.uploadedFileSrc;
	}
}