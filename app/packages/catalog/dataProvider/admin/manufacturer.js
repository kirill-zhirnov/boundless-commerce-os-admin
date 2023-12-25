import DataProvider from '../../../../modules/dataProvider/index';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class AdminManufacturerDataProvider extends DataProvider {
	//@ts-ignore
	getRules() {
		return [
			['title', 'safe'], // list of attrs, which will be used in filter
		//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.field('m.*');
		this.q.field('mt.*');

		this.q.field('i.width');
		this.q.field('i.height');
		this.q.field('i.path');
		this.q.field('i.mime_type');

		this.q.from('manufacturer', 'm');
		this.q.join('manufacturer_text', 'mt', 'mt.manufacturer_id = m.manufacturer_id');
		this.q.left_join('image', 'i', 'm.image_id = i.image_id');
		this.q.where('mt.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('m.status = \'published\'');

		this.compareRmStatus('m.deleted_at');
		return this.compare('mt.title', this.getSafeAttr('title'), true);
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: 'mt.title'
			}
		};
	}

	async prepareData(rows) {
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			row.url = this.url('@brand', {
				id : row.url_key ? row.url_key : row.manufacturer_id
			});

			if (row['image_id'] != null) {
				row.smallThumb = thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'xs');
			}

			rows[i] = row;
		}

		return [this.getMetaResult(), rows];
	}
}