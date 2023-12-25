import Widget from '../../../modules/widget/widget.client';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import utils from '../../../modules/utils/common.client';

export default class Css extends Widget {
	constructor(options) {
		super(options);

		this.clientExport = false;
	}

	async run() {
		// const cssUrl = await this.getView().getTheme().createCssUrl('frontend');
		const favIcon = await this.loadFaviconPath();

		let {staticCss} = wrapperRegistry.getConfig();
		if (Array.isArray(staticCss)) {
			staticCss = staticCss.map(url => utils.getGlobalStaticUrl(url));
		} else {
			staticCss = [];
		}

		return this.render('css', {
			favIcon,
			staticCss
		}, false);
	}

	async loadFaviconPath() {
		const instanceRegistry = this.getInstanceRegistry();
		const faviconNew = await instanceRegistry.getSettings().get('system', 'faviconNew');
		const newFavIconsList = {};

		if (faviconNew) {
			Object.keys(faviconNew).forEach(fileName => {
				return newFavIconsList[fileName] = instanceRegistry.getMediaUrl(faviconNew[fileName]);
			});
		}

		const oldFav = false;

		return {
			newFavIconsList,
			oldFav
		};
	}
}
