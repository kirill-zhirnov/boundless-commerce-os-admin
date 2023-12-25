import BasicController from '../../../modules/controller/basic';

export default class FaviconController extends BasicController {
	async actionBrowserConfig() {
		this.rejectHttpError(404, 'browserconfig.xml not found');
		return;

		// const newFavicon = await this.getSetting('system', 'faviconNew');
		//
		// if (!newFavicon || !newFavicon['browserconfig.xml']) {
		// 	this.rejectHttpError(404, 'browserconfig.xml not found');
		// 	return;
		// }
		//
		// const instanceRegistry = this.getInstanceRegistry();
		// const filePath = `${instanceRegistry.getMediaPath()}/public/${newFavicon['browserconfig.xml']}`;
		//
		// this.getResponse().setPerformWithExpress(false);
		// this.getFrontController().getResponse().sendFile(filePath);
		//
		// this.resolve();
	}

	async actionWebManifest() {
		this.rejectHttpError(404, 'webmanifest not found');
		return;

		// const newFavicon = await this.getSetting('system', 'faviconNew');
		//
		// if (!newFavicon || !newFavicon['android-chrome-192x192.png'] || !newFavicon['android-chrome-512x512.png']) {
		// 	this.rejectHttpError(404, 'webmanifest not found');
		// 	return;
		// }
		// const site = this.getSite();
		// const instanceRegistry = this.getInstanceRegistry();
		//
		// const outJson = {
		// 	"name": site.host,
		// 	"short_name": site.host,
		// 	"icons": [
		// 		{
		// 			"src": instanceRegistry.getMediaUrl(newFavicon['android-chrome-192x192.png']),
		// 			"sizes": "192x192",
		// 			"type": "image/png"
		// 		},
		// 		{
		// 			"src": instanceRegistry.getMediaUrl(newFavicon['android-chrome-512x512.png']),
		// 			"sizes": "512x512",
		// 			"type": "image/png"
		// 		}
		// 	],
		// 	"theme_color": "#ffffff",
		// 	"background_color": "#ffffff",
		// 	"start_url": "/",
		// 	"display": "standalone",
		// 	"orientation": "portrait"
		// };
		//
		// this.json(outJson);
	}
}