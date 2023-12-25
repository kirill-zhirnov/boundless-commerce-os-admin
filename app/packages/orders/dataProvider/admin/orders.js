import DataProvider from '../../../../modules/dataProvider/index';
import dateExtended from 'date-extended';
import _ from 'underscore';
import validator from '../../../../modules/validator/validator';

export default class OrdersDataProvider extends DataProvider {
	constructor(options) {
		super(options);

		this.validPageSize = [25, 50, 100, false];

		this.defaults = {
			rmStatus: 0,
			perPage: 50
		};

		this.allOption = ['', this.__('All')];
		this.needOrderConfirmation = null;
		this.orderStatusOptions = [];

		this.addOrdersItemsToQuery = false;
	}

	async setup() {
		await super.setup();

		this.needOrderConfirmation = await this.getInstanceRegistry().getSettings().get('orders', 'need_order_confirmation');
		//@ts-ignore
		this.orderStatusOptions = await this.getModel('orderStatus').findTreeOptions(this.getEditingLang().lang_id, [['', this.__('All statuses')]]);
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.needOrderConfirmation = this.needOrderConfirmation;

		return data;
	}

	getRules() {
		return [
			[
				'order_id,total_qty,total_price,status,shipping,customer,payment_method_id, is_paid, is_confirmed, created_to, created_from, country_id, address',
				'safe'
			],
			[
				'customer_id', 'isNum'
			],
			['campaign_id', 'inOptions', {options: 'couponCampaign'}],
			['cash_gotten', 'inOptions', {options: 'cashGottenStatus'}],
			['coupon_code, track_number', 'trim']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const escapedLangId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('o.order_id');
		this.q.field('o.created_at');
		this.q.field(`
			case
				when o.paid_at is not null then 1
				else 0
			end as is_paid
		`);
		this.q.field(`
			case
				when o.confirmed_at is not null then 1
				else 0
			end as is_confirmed
		`);
		this.q.field(`
			case
				when delivery.delivery_id is null then 0
				when shipping.alias = 'selfPickup' then 1
				else 2
			end as shipping_type
		`);
		this.q.field(this.getOrderStatusSortKey());

		this.q.field('reserve.reserve_id');
		this.q.field('reserve.total_qty');
		this.q.field('reserve.total_price', 'items_subtotal');
		this.q.field('o.total_price');
		this.q.field('o.got_cash_at');
		this.q.field('o.discount_for_order', 'order_discount');
		this.q.field('o.service_total_price', 'order_shipping_price');

		this.q.field('o.customer_id');
		this.q.field('person.registered_at');
		this.q.field('person.email');
		this.q.field('person_profile.first_name');
		this.q.field('person_profile.last_name');
		this.q.field('person_profile.comment', 'person_comment');

		//default address for main grid
		this.q.field('vw_country.country_id');
		this.q.field('vw_country.title', 'country_title');
		this.q.field('person_address.state');
		this.q.field('person_address.city');
		this.q.field('person_address.address_line_1');
		this.q.field('person_address.address_line_2');

		//shipping address for export grid
		this.q.field('shipping_country.country_id', 'shipping_country_id');
		this.q.field('shipping_country.title', 'shipping_country_title');
		this.q.field('ship.state', 'shipping_state');
		this.q.field('ship.city', 'shipping_city');
		this.q.field('ship.address_line_1', 'shipping_address_line_1');
		this.q.field('ship.address_line_2', 'shipping_address_line_2');
		this.q.field('ship.zip', 'shipping_zip');
		this.q.field('ship.company', 'shipping_company');

		//billing address for export grid
		this.q.field('billing_country.country_id', 'billing_country_id');
		this.q.field('billing_country.title', 'billing_country_title');
		this.q.field('billing.state', 'billing_state');
		this.q.field('billing.city', 'billing_city');
		this.q.field('billing.address_line_1', 'billing_address_line_1');
		this.q.field('billing.address_line_2', 'billing_address_line_2');
		this.q.field('billing.zip', 'billing_zip');
		this.q.field('billing.company', 'billing_company');

		this.q.field('person_profile.phone');
		this.q.field('delivery.delivery_id');
		this.q.field('shipping.alias', 'delivery_alias');
		this.q.field('delivery_text.title', 'delivery_title');
		// this.q.field('osd_delivery.sub_type', 'delivery_sub_type');
		// this.q.field('osd_delivery.data', 'delivery_data');
		this.q.field('osd_delivery.title', 'custom_delivery_title');
		this.q.field('order_status.status_id');
		this.q.field('order_status.background_color', 'status_background_color');
		this.q.field('order_status_text.title', 'status_title');
		this.q.field('payment_method_text.title', 'payment_method_title');
		this.q.field('order_prop.client_comment');
		this.q.field('order_prop.custom_attrs');
		this.q.field('adm_comments.has_admin_comments');

		this.q.from('orders', 'o');
		this.q.left_join('reserve', 'reserve', 'o.order_id = reserve.order_id');
		this.q.left_join('person', null, 'o.customer_id = person.person_id');
		this.q.left_join('person_profile', null, 'person.person_id = person_profile.person_id');
		this.q.left_join('order_status', 'status', 'o.status_id = status.status_id');
		this.q.left_join('person', 'client', 'o.customer_id = client.person_id');
		this.q.left_join('person_profile', 'client_profile', 'client.person_id = client_profile.person_id');
		this.q.left_join('person_address', null, 'person_address.person_id = person.person_id and person_address.is_default is true');
		this.q.left_join('vw_country', null, `vw_country.country_id = person_address.country_id and vw_country.lang_id = ${escapedLangId}`);

		this.q.left_join('person_address', 'ship', 'ship.person_id = person.person_id and ship.type = \'shipping\'');
		this.q.left_join('vw_country', 'shipping_country', 'shipping_country.country_id = ship.country_id');

		this.q.left_join('person_address', 'billing', 'billing.person_id = person.person_id and billing.type = \'billing\'');
		this.q.left_join('vw_country', 'billing_country', 'billing_country.country_id = billing.country_id');

		this.q.left_join('person_search', null, 'person_search.person_id = person.person_id');
		this.q.left_join('point_sale', 'point', 'point.point_id = o.point_id');
		this.q.left_join('site', null, 'site.site_id = point.site_id');
		this.q.left_join('order_service', 'osd', 'osd.order_id = o.order_id and osd.is_delivery is true');
		this.q.left_join('order_service_delivery', 'osd_delivery', 'osd.order_service_id = osd_delivery.order_service_id');
		this.q.left_join('delivery', null, 'delivery.delivery_id = osd_delivery.delivery_id');
		this.q.left_join('delivery_text', null, `delivery.delivery_id = delivery_text.delivery_id and delivery_text.lang_id = ${escapedLangId}`);
		this.q.left_join('vw_shipping', 'shipping', 'shipping.shipping_id = delivery.shipping_id');
		this.q.left_join('order_status', null, 'o.status_id = order_status.status_id');
		this.q.left_join('order_status_text', null, `order_status_text.status_id = order_status.status_id and order_status_text.lang_id = ${escapedLangId}`);
		this.q.left_join('payment_method', null, 'payment_method.payment_method_id = o.payment_method_id');
		this.q.left_join('order_prop', null, 'order_prop.order_id = o.order_id');
		this.q.left_join(
			'payment_method_text',
			null,
			`payment_method.payment_method_id = payment_method_text.payment_method_id and payment_method_text.lang_id = ${escapedLangId}`
		);
		// this.q.left_join('vw_region', null, `vw_region.region_id = address.custom_region_id and vw_region.lang_id = ${escapedLangId}`);
		this.q.left_join(`
			(
				select
					essence_local_id as order_id,
					1 as has_admin_comments
				from
					admin_comment
					inner join essence using(essence_id)
				where
					essence.type = 'orders'
				group by
					essence_local_id
			)
		`, 'adm_comments', 'adm_comments.order_id = o.order_id');
		this.q.where('o.publishing_status = ?', 'published');

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		const {order_id, total_qty, total_price, status, customer_id, created_from, created_to, country_id, address} = attrs;

		this.compareNumber('o.order_id', order_id);
		this.compare('reserve.total_qty', total_qty);
		this.compareNumber('o.total_price', total_price);
		this.compare('o.status_id', status);
		this.compare('o.customer_id', customer_id);

		this.compare('person_address.country_id', country_id);
		if (validator.trim(address)) {
			const addressLike = `%${String(address).toLowerCase()}%`;
			this.q.where(`
				lower(person_address.state) like ?
				or lower(person_address.city) like ?
				or lower(person_address.address_line_1) like ?
				or lower(person_address.address_line_2) like ?
				`, addressLike, addressLike, addressLike, addressLike
			);
		}

		const createdToParsed = this.parseDate4Filter(created_to);
		if (createdToParsed !== false) {
			this.q.where('o.created_at < ?', dateExtended.format(createdToParsed[1], 'yyyy-MM-dd'));
		}

		const createdFromParsed = this.parseDate4Filter(created_from);
		if (createdFromParsed !== false) {
			this.q.where('o.created_at >= ?', dateExtended.format(createdFromParsed[0], 'yyyy-MM-dd'));
		}

		//@ts-ignore
		const {shipping, customer, is_paid, is_confirmed, track_number} = attrs;

		if (shipping) {
			switch (shipping) {
				case 'no':
					this.q.where('delivery.delivery_id is null and osd.order_service_id is null');
					break;
				case 'selfPickup':
					this.compare('shipping.alias', 'selfPickup');
					break;
				default:
					this.compare('delivery.delivery_id', shipping);
			}
		}


		if (customer) {
			this.q.where('lower(person_search.search) like ?', `%${customer.toLowerCase()}%`);
		}

		if (is_paid === '1') {
			this.q.where('o.paid_at is not null');
		} else if (is_paid === '0') {
			this.q.where('o.paid_at is null');
		}

		if (is_confirmed === '1') {
			this.q.where('o.confirmed_at is not null');
		} else if (is_confirmed === '0') {
			this.q.where('o.confirmed_at is null');
		}

		if (track_number && (track_number !== '')) {
			this.q.where(`
				exists (
					select
						1
					from
						track_number
					where
						order_id = o.order_id
						and lower(track_number) like ?
				)
			`, `%${track_number.toLowerCase()}%`);
		}

		//@ts-ignore
		if (attrs.campaign_id || attrs.coupon_code) {
			this.appendCouponWhere();
		}

		if (this.addOrdersItemsToQuery) {
			this.appendOrderItems();
		}
	}

	async prepareData(rows) {
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			row.total_price_formatted = this.getLocale().formatMoney(row.total_price);

			let shippingType = 'no';
			if (row.delivery_id != null) {
				shippingType = 'shipping';

				if (row.delivery_alias === 'selfPickup') {
					shippingType = 'selfPickup';
				}
			}

			row.shipping_type = shippingType;

			rows[i] = row;
		}

		return [this.getMetaResult(), rows];
	}

	sortRules() {
		return {
			default: [{created_at: 'desc'}],
			attrs: {
				order_id: 'o.order_id',
				created_at: 'o.created_at',
				customer: 'person_search.search',
				// city: 'city.city_title',
				// shipping: {
				// 	asc: 'shipping_type asc, delivery_title asc',
				// 	desc: 'shipping_type desc, delivery_title desc'
				// },
				total_price:
					'o.total_price',
				status: 'status_sort_key',
				country_id: {
					asc: 'vw_country.title asc nulls first',
					desc: 'vw_country.title desc nulls last'
				},
			}
		};
	}

	//@ts-ignore
	async rawOptions() {
		return _.extend(super.rawOptions(), {
			//@ts-ignore
			country: this.getModel('country').findCountryOptions(this.getEditingLang().lang_id, [['', this.__('All countries')]]),
			orderStatus: this.orderStatusOptions,
			shipping: this.getShippingOptions([this.allOption]),
			//@ts-ignore
			paymentMethod: await this.getModel('paymentMethod').findAllOptions(this.getEditingLang().lang_id, [this.allOption]),
			paymentStatus: this.getYesNoOptions(),
			confirmedStatus: this.getYesNoOptions(),
			//@ts-ignore
			couponCampaign: this.getModel('couponCampaign').findOptions([this.allOption]),
			customAttrs: await this.getModel('orderAttrs').findAll({order: [['sort', 'asc']]}),
		});
	}

	getYesNoOptions() {
		return [
			this.allOption,
			['1', this.getI18n().__('Yes')],
			['0', this.getI18n().__('No')]
		];
	}

	async getShippingOptions(out) {
		if (out == null) {out = [];}

		out.push(['no', this.getI18n().__('No shipping')]);

		//@ts-ignore
		const result = await this.getModel('delivery').findOptions(this.getEditingLang().lang_id, this.getEditingSite().site_id, out);

		return result;
	}

	getOrderStatusSortKey() {
		const cases = [];

		for (let i = 0; i < this.orderStatusOptions.length; i++) {
			const item = this.orderStatusOptions[i];
			if (item[0] === '') {
				continue;
			}

			cases.push(`when o.status_id = '${item[0]}' then '${i}'`);
		}

		return `
			case
			${cases.join(' ')}
			end as status_sort_key
		`;
	}

	appendCouponWhere() {
		//@ts-ignore
		const {campaign_id, coupon_code} = this.getSafeAttrs();
		const where = [];
		const params = [];

		if (campaign_id) {
			where.push('coupon_code.campaign_id = ?');
			params.push(campaign_id);
		}

		if (coupon_code) {
			where.push('coupon_code.code like ?');
			params.push(`%${coupon_code}%`);
		}

		this.q.where(`
			exists (
				select
					1
				from
					order_discount
					inner join coupon_code using(code_id)
				where
					${where.join(' and ')}
					and order_discount.order_id = o.order_id
			)
		`, params);
	}

	appendOrderItems() {
		this.q.left_join(`
			(
				select
					reserve_id,
					json_agg(
						json_build_object(
							'item_id', item_id,
							'type', type,
							'product', product,
							'variant', variant,
							'custom_item', custom_item,
							'final_price', final_price,
							'qty', qty,
							'total_price', total_price
					)) as items
				from
					reserve_item
					inner join vw_inventory_item using(item_id)
					left join item_price using(item_price_id)
				group by reserve_id
			)
		`, 'ordered_items', 'ordered_items.reserve_id = reserve.reserve_id');
		this.q.field('ordered_items.items');
		this.q.limit(2000);
		//hardcoded pagination:
	}

	setAddOrdersItemsToQuery(val) {
		this.addOrdersItemsToQuery = val;

		return this;
	}
}