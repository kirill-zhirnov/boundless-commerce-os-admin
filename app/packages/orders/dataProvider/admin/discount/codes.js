import DataProvider from '../../../../../modules/dataProvider/index';

export default class CodesDataProvider extends DataProvider {
	constructor(options) {
		super(options);

		//turn off possibility to show all campaign without pagination
		this.validPageSize = [25, 50, 100];
	}

	getRules() {
		return super.getRules().concat([
			['title, discount, code', 'trim'],
			['title, discount, code', 'toLowerCase']
		]);
	}

	createQuery() {
		this.q.field('coupon_campaign.campaign_id', 'id');
		this.q.field('coupon_campaign.*');
		this.q.field('codes_qty.total_codes');
		this.q.field('codes_qty.total_orders');
		this.q.field('codes_qty.sum_price');
		this.q.field('codes_qty.sum_discount');

		this.q.from('coupon_campaign');
		this.q.left_join(`
			(
				select
					campaign_id,
					count(distinct code_id) as total_codes,
					count(order_id) as total_orders,
					coalesce(sum(orders.total_price), 0) as sum_price,
					coalesce(sum(orders.discount_for_order), 0) as sum_discount
				from
					coupon_code
					left join order_discount using(code_id)
					left join orders using(order_id)
				group by
					campaign_id
			)
		`, 'codes_qty', 'coupon_campaign.campaign_id = codes_qty.campaign_id');

		let safeAttrs = this.getSafeAttrs();

		this.compare('lower(coupon_campaign.title)', safeAttrs.title, true);
		this.compare('coupon_campaign.discount_type', safeAttrs.discount);

		if (safeAttrs.code) {
			this.q.distinct();
			this.q.join('coupon_code', null, 'coupon_code.campaign_id = coupon_campaign.campaign_id');
			this.compare('lower(coupon_code.code)', safeAttrs.code, true);
		}

		this.compareRmStatus('coupon_campaign.deleted_at');
	}

	async prepareData(rows) {
		for (let i = 0; i < rows.length; i++) {
			rows[i].codes = await this.findFirstCodes(rows[i].campaign_id);
		}

		return [this.getMetaResult(), rows];
	}

	async findFirstCodes(campaignId) {
		const rows = await this.getDb().sql(`
			select
				code
			from
				coupon_code
			where
				campaign_id = :campaignId
			order by created_at asc
			limit 5
		`, {
			campaignId
		});

		const out = [];
		rows.forEach((row) => {
			out.push(row.code);
		});

		return out;
	}

	rawOptions() {
		return {
			type: this.getModel('couponCampaign').getDiscountTypeOptions(this.getI18n(), [['', '']])
		};
	}

	sortRules() {
		return {
			default: [{title: 'desc'}],
			attrs: {
				title: 'coupon_campaign.created_at'
			}
		};
	}
}