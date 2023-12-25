import Form from '../../../../modules/form/index';
import _ from 'underscore';
import {Op} from 'sequelize';

export default class ProductProps extends Form {
	getRules() {
		return [
			['country_of_origin', 'inOptions', {options: 'countryOfOrigin'}],
			['manufacturer_id', 'inOptions', {options: 'manufacturer'}],
			['external_id', 'isUnique', {
				field: 'external_id',
				model: this.getModel('product'),
				criteria: {
					where: {
						product_id: {
							[Op.ne]: this.pk
						}
					}
				}
			}]
		];
	}

	async save() {
		//@ts-ignore
		const {external_id, manufacturer_id, country_of_origin} = this.getSafeAttrs();
		//@ts-ignore
		const {product_id} = this.record;

		await this.getModel('product').update({
			external_id,
			manufacturer_id
		}, {
			where: {
				product_id
			}
		});

		await this.getModel('productProp').update({
			country_of_origin
		}, {
			where: {
				product_id
			}
		});
	}

	async setupAttrs() {
		if (!this.record)
			throw new Error('Record should be set by parent form in form group!');

		let attrs = Object.assign(
			_.pick(this.record, ['external_id', 'manufacturer_id']),
			//@ts-ignore
			_.pick(this.record.productProp, ['country_of_origin'])
		);

		this.setAttributes(attrs);
	}

	rawOptions() {
		return {
			//@ts-ignore
			countryOfOrigin: this.getModel('country').findCountryOptions(this.getEditingLang().lang_id),
			manufacturer: this.loadManufacturerOptions()
		};
	}

	async loadManufacturerOptions() {
		//@ts-ignore
		let options = await this.getModel('manufacturer').findOptions(this.getEditingLang().lang_id);
		options.push(['create', this.__('+ Create new manufacturer')]);

		return options;
	}
}