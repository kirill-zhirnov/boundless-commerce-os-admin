import BasicSaver from '../basic';
import {Op} from 'sequelize';

export default class ProductProperties extends BasicSaver {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.allowToSave = [
			'status',
			'sku',
			'external_id',
			'manufacturer',
			'commodityGroup',
			'offerGroupId',
			'name',
			'description',
			'country_of_origin'
		];
	}

	async process() {
		await this.saveProductAttrs();
		await this.saveProductTextFields();

		if (this.shallSave('offerGroupId') && this.dataRow.offerGroupId) {
			await this.db.model('productProp').extendExtra(this.product.product_id, {
				offerGroupId: this.dataRow.offerGroupId
			});
		}

		if (this.shallSave('country_of_origin') && this.dataRow.country_of_origin) {
			const row = await this.db.model('country').findByTitle(
				this.lang.lang_id,
				this.dataRow.country_of_origin
			);

			if (row) {
				await this.db.model('productProp').update({
					country_of_origin: row.country_id
				}, {
					where: {
						product_id: this.product.product_id
					}
				});
			}
		}
	}

	async saveProductAttrs() {
		const upAttrs = {};

		if (this.shallSave('status'))
			Object.assign(upAttrs, {
				status: 'published',
				deleted_at: null
			});

		if (this.shallSave('sku') && this.dataRow.sku) {
			let row = await this.db.model('product').findOne({
				where: {
					sku: this.dataRow.sku,
					product_id: {
						[Op.ne]: this.product.product_id
					}
				}
			});

			if (!row)
				upAttrs.sku = this.dataRow.sku;
		}

		if (this.shallSave('external_id') && this.dataRow.external_id) {
			let row = await this.db.model('product').findOne({
				where: {
					external_id: this.dataRow.external_id,
					product_id: {
						[Op.ne]: this.product.product_id
					}
				}
			});

			if (!row)
				upAttrs.external_id = this.dataRow.external_id;
		}

		if (this.shallSave('manufacturer') && this.dataRow.manufacturer) {
			let row = await this.db.model('manufacturer').findOrCreateByTitle(
				this.dataRow.manufacturer,
				this.lang.lang_id
			);

			upAttrs.manufacturer_id = row.manufacturer_id;
		}

		if (this.shallSave('commodityGroup')) {
			let group;

			if (this.dataRow.commodity_group) {
				group = await this.db.model('commodityGroup').findOrCreateByTitle(
					this.dataRow.commodity_group,
					this.lang.lang_id
				);
			} else {
				if (!this.product.group_id)
					group = await this.db.model('commodityGroup').findOrCreateDefault(this.lang.lang_id, this.i18n);
			}

			if (group)
				upAttrs.group_id = group.group_id;
		}

		if (Object.keys(upAttrs).length) {
			await this.product
				.set(upAttrs)
				.save()
				;
		}
	}

	shallSave(prop) {
		return this.allowToSave.indexOf(prop) != -1;
	}

	setAllowToSave(val) {
		this.allowToSave = val;

		return this;
	}

	async saveProductTextFields() {
		if (this.shallSave('name') && this.dataRow.name) {
			const url = await this.db.model('product').createUrlKeyByTitle(this.dataRow.name, this.lang.code, this.product.product_id);
			await this.db.model('productText').update({
				title: this.dataRow.name,
				url_key: url
			}, {
				where: {
					product_id: this.product.product_id,
					lang_id: this.lang.lang_id
				}
			});
		}

		if (this.shallSave('description') && this.dataRow.description)
			await this.db.model('productText').setDescription(this.product.product_id, this.lang.lang_id, this.dataRow.description);
	}
}