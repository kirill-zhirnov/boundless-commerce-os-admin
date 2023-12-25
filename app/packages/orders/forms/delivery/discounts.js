import Form from '../../../../modules/form/index';
import validator from 'validator';

export default class DeliveryDiscountsForm extends Form {
	getRules() {
		return [
			['free_shipping_from', 'validateFreeShipping']
		];
	}

	async getTplData() {
		const data = await super.getTplData();
		const rows = await this.loadDelivery();
		data.attrs.delivery = rows;

		return data;
	}

	async loadDelivery() {
		const rows = await this.getDb().sql(`
			select
				delivery_id,
				vw_shipping.alias,
				free_shipping_from,
				title
			from
				delivery
			inner join delivery_text using(delivery_id)
			inner join delivery_site using(delivery_id)
			left join vw_shipping using(shipping_id)
			where
				delivery_text.lang_id = :lang
				and delivery_site.site_id = :site
				and delivery.deleted_at is null
			order by
				sort asc
		`, {
			lang: this.getEditingLang().lang_id,
			site: this.getEditingSite().site_id
		});

		return rows;
	}

	async save() {
		const freeShipping = this.getSafeAttrs().free_shipping_from;

		for (let [key, val] of Object.entries(freeShipping)) {
			const deliveryId = key.replace('delivery_', '');

			val = String(val).replace(',', '.');
			val = parseFloat(val);
			if (isNaN(val)) {
				val = null;
			}

			await this.getModel('delivery').update({
				free_shipping_from: val || null
			}, {
				where: {
					delivery_id: deliveryId
				}
			});
		}
	}

	validateFreeShipping(value) {
		for (const key in value) {
			const val = value[key];
			if (val === '') {
				continue;
			}

			if (!validator.isDotNumeric(val, {min: 0})) {
				this.addError(`${key}`, 'notNumber', this.__('String should contain only numbers and comma.'));
			}
		}

		return true;
	}
}