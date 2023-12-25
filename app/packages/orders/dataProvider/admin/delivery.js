import BasicDataProvider from '../../../../modules/dataProvider';

export default class DeliveryDataProvider extends BasicDataProvider {
	getRules() {
		return [
			['delivery_id,title,is_used,sort', 'safe']
		].concat(super.getRules());
	}

	createQuery() {
		const siteIdEscaped = this.getDb().escape(this.getEditingSite().site_id);
		const langIdEscaped = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('delivery.delivery_id');

		this.q.field('delivery.calc_method');
		this.q.field('delivery.shipping_config->>\'price\' as single_price');
		this.q.field('delivery.img');

		this.q.field(`
			case
				when ds.site_id is not null then 1
				else 0
			end as is_used
		`);
		this.q.field('dt.title');
		this.q.field('dt.description');

		this.q.field('ds.sort');
		this.q.field('delivery.deleted_at');
		this.q.field('shipping.alias as shipping_alias');
		this.q.field('shipping_text.title as shipping_title');

		this.q.from('delivery');
		this.q.join('delivery_text', 'dt', 'dt.delivery_id = delivery.delivery_id');
		this.q.join('delivery_site', 'ds', `ds.delivery_id = delivery.delivery_id and ds.site_id = ${siteIdEscaped}`);
		this.q.left_join('shipping', 'shipping', 'shipping.shipping_id = delivery.shipping_id');
		this.q.left_join('shipping_text', 'shipping_text', `shipping.shipping_id = shipping_text.shipping_id and shipping_text.lang_id = ${langIdEscaped}`);

		this.q.where('dt.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('delivery.status = ?', 'published');
		this.compareRmStatus('delivery.deleted_at');

		this.compare('delivery.delivery_id', this.getSafeAttr('delivery_id'));
		this.compare('dt.title', this.getSafeAttr('title'), true);
		this.compareNumber('ds.sort', this.getSafeAttr('sort'));

		const isUsed = this.getSafeAttr('is_used');
		if (isUsed === '1') {
			return this.q.where('ds.site_id is not null');
		} else if (isUsed === '0') {
			return this.q.where('ds.site_id is null');
		}
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				delivery_id: 'delivery.delivery_id',
				title: 'dt.title',
				sort: 'is_used desc, ds.sort'
			}
		};
	}
}
