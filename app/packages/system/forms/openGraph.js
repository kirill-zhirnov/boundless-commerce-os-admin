import Form from '../../../modules/form/index';

export default class OpenGraph extends Form {
	getRules() {
		return [
			['ogDescription', 'safe']
		];
	}

	async getTplData() {
		const data = await super.getTplData();
		const openGraph = await this.getInstanceRegistry().getSettings().get('cms', 'openGraph');

		if (openGraph.img) {
			//@ts-ignore
			data.attrs.img = this.getInstanceRegistry().getMediaUrl(openGraph.img);
		}

		//@ts-ignore
		data.attrs.ogDescription = openGraph.description;

		return data;
	}

	async save() {
		const data = await this.getInstanceRegistry().getSettings().get('cms', 'openGraph');

		//@ts-ignore
		data.description = this.getSafeAttr('ogDescription');
		return await this.getInstanceRegistry().getSettings().set('cms', 'openGraph', data);
	}
}