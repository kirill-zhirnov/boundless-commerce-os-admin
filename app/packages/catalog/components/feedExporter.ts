import {TFeedType} from '../../../@types/catalog';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import GoogleFeed from './feedExporter/googleFeed';
import {IFeedsModel} from '../models/feeds';
import {TDataFeed} from './feedExporter/types';

export default class FeedExporter {
	constructor(protected instanceRegistry: IInstanceRegistry, protected feed: IFeedsModel) {}

	public async process(dataFeed: TDataFeed) {
		const exporter = this.getExporterByType();

		const data = await exporter.export(dataFeed);
		return {contentType: exporter.contentType, data};
	}

	private getExporterByType() {
		switch (this.feed.type) {
			case TFeedType.googleShopping:
				return new GoogleFeed(this.instanceRegistry, this.feed);
			default:
				throw new Error('Unknown feed type');
		}
	}
}