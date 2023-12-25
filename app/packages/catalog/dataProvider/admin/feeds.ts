import DataProvider from '../../../../modules/dataProvider/index';
import {IFeeds} from '../../../../@types/catalog';

export default class FeedsDataProvider extends DataProvider<IFeeds> {
	getRules() {
		return super.getRules().concat([
			['type, title', 'safe']
		]);
	}
	createQuery() {
		const {title, type} = this.getSafeAttrs() as IFeeds;
		this.q.from('feeds');
		if (type){
			this.q.where('type = ?', this.getSafeAttr('type'));
		}
		this.compareRmStatus('feeds.deleted_at');
		if (title) {
			const titleLike = `%${String(title).toLowerCase()}%`;
			this.q.where('lower(feeds.title) like ?', titleLike);
		}
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'feeds.title'
			}
		};
	}

	rawOptions() {
		return {
			types: this.getTypeOptions()
		};
	}

	getTypeOptions() {
		return [
			['', this.__('All')],
			['google-shopping', this.__('Google shopping')],
			['facebook', this.__('Facebook')],
		];
	}
}
