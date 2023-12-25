import BasicForm from '../../../../modules/form';

export default class CreateDeliveryForm extends BasicForm {
	getRules() {
		return [
			['type', 'required'],
			['type', 'inOptions', {options: 'type'}],
			['type', 'validateUniqueShipping']
		];
	}

	save() {
	}

	rawOptions() {
		return {
			type: this.getTypeOptions()
		};
	}

	async getTypeOptions() {
		const rows = await this.getModel('shipping').findOptions(this.getEditingLang().lang_id, [], 'alias', true);

		rows.sort(function (a, b) {
			if (a[0] === 'selfPickup') {
				return 1;
			} else if (b[0] === 'selfPickup') {
				return -1;
			} else {
				return 0;
			}
		});

		rows.push(['custom', this.__('Other delivery service')]);

		return rows;
	}

	async validateUniqueShipping() {
		if (this.attributes.type === 'self') {
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
			alias: this.attributes.type
		});

		if (rows.length > 0) {
			this.addError('type', 'alreadyExists', this.__('Shipping company has already been added.'));
		}
	}
}
