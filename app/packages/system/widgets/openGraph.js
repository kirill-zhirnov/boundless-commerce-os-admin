import Widget from '../../../modules/widget/widget.client';
import _ from 'underscore';

export default class OpenGraph extends Widget {
	constructor(options) {
		super(options);

		this.clientExport = false;

		this.data = _.omit(this.data, val => {
			return _.isNull(val) || _.isUndefined(val);
		});
	}

	async run() {
		const data = await this.loadOpenGraph();
		return this.render('openGraph', data, false);
	}

	async loadOpenGraph() {
		if (!this.data.currentUrl) {
			const req = this.getFrontController().getRequest();
			this.data.currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
		}

		if (this.data.description && this.data.img)
			return this.data;

		const instanceRegistry = this.getInstanceRegistry();
		const openGraph = await instanceRegistry.getSettings().get('cms', 'openGraph');
		if (openGraph.img && !this.data.img) {
			openGraph.img = instanceRegistry.getMediaUrl(openGraph.img);
		}

		Object.assign(openGraph, this.data);
		return openGraph;
	}
}
