import BasicController from '../../../modules/controller/basic';
import Thumbnail from '../modules/thumbnail';

export default class ImageController extends BasicController {
	async actionThumbnail() {
		if (this.getInstanceRegistry().getConfig().staticServer.resizeAccessKey !== this.getParam('key')) {
			this.rejectHttpError(404, 'File not found');
			return;
		}

		const thumbnail = new Thumbnail(this.getInstanceRegistry(), this.getParam('imgPath'));
		const img = await thumbnail.process();
		this.getAnswer().setPerformWithExpress(false);

		const response = this.getFrontController().getResponse();
		response.removeHeader('Cache-Control');
		response.sendFile(img.absolute);
	}
}