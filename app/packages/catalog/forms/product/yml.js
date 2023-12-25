import ProductBasic from './basic';

export default class ProductYml extends ProductBasic {
	constructor(options) {
		super(options);

		this.productYml = null;
		this.checkboxKeys = [
			'manufacturer_warranty',
			'seller_warranty',
			'adult',
			'yml_export'
		];
	}

	getRules() {
		return [
			['vendor_code, model', 'isLength', {min: 0, max: 255}],
			['title, description', 'safe'],
			['sales_notes', 'isLength', {min: 0, max: 50}],
			['age', 'inOptions', {options: 'age'}],
			[
				'manufacturer_warranty, seller_warranty, adult, yml_export',
				'safe'
			]
		];
	}

	async save() {
		let attrs = this.getSafeAttrs();
		this.productYml.set(attrs);
		this.checkboxKeys.forEach((key) => {
			let val = (attrs[key] == '1') ? true : false;

			this.productYml.set(key, val);
		});

		await this.productYml.save();
	}

	async getRecord() {
		let record = await super.getRecord();

		if (record && !this.productYml) {
			//@ts-ignore
			this.productYml = await this.getModel('productYml').findException({
				where: {
					//@ts-ignore
					product_id: record.product_id
				}
			});
		}

		return record;
	}

	setupAttrsByRecord() {
		let attrs = this.productYml.toJSON();
		this.setAttributes(attrs);
	}

	rawOptions() {
		return {
			age: [
				['', this.__('Select')],
				['0', '0'],
				['6', '6'],
				['12', '12'],
				['16', '16'],
				['18', '18']
			]
		};
	}
}