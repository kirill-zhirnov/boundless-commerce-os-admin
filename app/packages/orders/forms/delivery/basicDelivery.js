import BasicForm from '../../../../modules/form';
import _ from 'underscore';
import formula from 'formula';
import validator from '../../../../modules/validator/validator';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class BasicDeliveryForm extends BasicForm {
	constructor(options) {
		super(options);

		this.shipping = null;
		this.shippingAlias = null;
		this.deliverySiteId = null;
	}

	async setup() {
		let res;
		if (this.pk) {
			res = {pk: this.pk, scenario: 'update'};
		} else {
			res = await this.createDraftDelivery();
		}

		({pk: this.pk, scenario: this.scenario} = res);

		if (this.shippingAlias) {
			const rows = await this.getDb().sql(`
					select
						shipping.*,
						shipping_text.*,
						delivery.delivery_id
					from
						shipping
						inner join shipping_text using(shipping_id)
						left join delivery using(shipping_id)
					where
						shipping.alias = :alias
						and shipping_text.lang_id = :lang
				`, {
				alias: this.shippingAlias,
				lang: this.getEditingLang().lang_id
			});

			this.shipping = rows[0];

			if (this.shipping.delivery_id) {
				this.pk = this.shipping.delivery_id;
			}
		}

		await super.setup();
	}

	async createDraftDelivery() {
		const [row] = await this.getDb().sql(`
			insert into delivery
				(status, created_by)
			values
				('draft', :created)
			on conflict (status, created_by)
			where status = 'draft' and created_by is not null
			do update set
				status = excluded.status
			returning delivery_id
		`, {
			created: this.getUser().getId()
		});

		return {
			pk: row.delivery_id,
			scenario: 'insert'
		};
	}

	async loadRecord() {
		const [row] = await this.getDb().sql(`
			select
				delivery.delivery_id,
				delivery.calc_method,
				delivery.img,
				delivery.tax,
				delivery.mark_up,
				dt.title,
				dt.description,
				delivery_site_id,
				sort,
				shipping.shipping_id,
				delivery.shipping_config,
				shipping.alias as shipping_alias,
				shipping_text.title as shipping_title
			from
				delivery
				inner join delivery_text dt on delivery.delivery_id = dt.delivery_id and dt.lang_id = :lang
				left join delivery_site ds on delivery.delivery_id = ds.delivery_id and ds.site_id = :site
				left join shipping using(shipping_id)
				left join shipping_text on
				shipping.shipping_id = shipping_text.shipping_id
				and shipping_text.lang_id = :lang
			where
				delivery.delivery_id = :id
		`, {
			id: this.pk,
			lang: this.getEditingLang().lang_id,
			site: this.getEditingSite().site_id
		});

		if (!row) {
			throw new Error(`Delivery with pk='${this.pk}' not found!`);
		}

		this.deliverySiteId = row.delivery_site_id;

		//@ts-ignore
		return row;
	}

	async setupAttrsByRecord() {
		this.setAttributes(this.record);

		if (this.record.img) {
			this.attributes.img = thumbnailUrl.getAttrs(this.getInstanceRegistry(), {path: this.record.img}, 'scaled', 's').src;
		}

		if (!this.attributes.shipping_config) {
			this.attributes.shipping_config = {};
		}
	}

	async saveDeliverySite(deliveryId, sort = null) {
		await this.getDb().sql(`
			insert into delivery_site
				(site_id, delivery_id)
			values
				(:siteId, :deliveryId)
			on conflict (site_id, delivery_id)
			do update
			set
				sort = :sort
		`, {
			siteId: this.getEditingSite().site_id,
			deliveryId,
			sort: sort && (sort !== '') ? sort : null
		});
	}

	async saveDeliveryText(deliveryId, title, description) {
		await this.getModel('deliveryText').update({
			title,
			description
		}, {
			where: {
				delivery_id: deliveryId,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	async useShipping(shippingAlias, calcMethod, shippingConfig, locationShippingId = null, deliveryAttrs = {}) {
		const rows = await this.getDb().sql(`
			select
				shipping_id
			from
				shipping
			where
				alias = :alias
		`, {
			alias: shippingAlias
		});

		if (!rows.length) {
			throw new Error(`Shipping with alias ${shippingAlias} not found!`);
		}

		await this.getModel('delivery').update(_.extend({
			calc_method: calcMethod,
			shipping_id: rows[0].shipping_id,
			shipping_config: shippingConfig,
			location_shipping_id: locationShippingId,
			status: 'published',
			deleted_at: null
		}, deliveryAttrs), {
			where: {
				delivery_id: this.pk
			}
		});

		return this.pk;
	}

	async validateShippingNotExists(value, options, attr) {
		if (this.record) {
			return;
		}

		const rows = await this.getDb().sql(`
			select
				delivery_id,
				deleted_at
			from
				delivery
				inner join shipping using(shipping_id)
			where
				shipping.alias = :alias
				and deleted_at is null
		`, {
			alias: this.shippingAlias
		});

		if (rows.length > 0) {
			this.addError(attr, 'alreadyExists', this.__('Shipping company has already been added.'));
		}
	}

	rawOptions() {
		return _.extend(super.rawOptions(), {
			tax: this.getModel('setting').getVatOptions(this.getI18n())
		});
	}

	validateMarkUp(value, options, attribute) {
		value = validator.trim(value);

		if (!value) {
			this.attributes[attribute] = '';
			return;
		}

		try {
			formula.run(value, {
				SHIPPING_COST: 100,
				SHIPPING_TYPE: 'courier',
				ORDER_AMOUNT: 1000,
				ORDER_ITEM_QTY: 2
			});

			this.attributes[attribute] = value;
		} catch (e) {
			this.addError(attribute, 'wrongFormula', this.p__('formula', 'Error in formula.'));
			return;
		}
	}
}
