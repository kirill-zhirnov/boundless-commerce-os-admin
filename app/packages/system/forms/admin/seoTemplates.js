import Form from '../../../../modules/form/index';
import ProductSeoTpl from '../../../catalog/modules/seoTemplates/product';
import CategorySeoTpl from '../../../catalog/modules/seoTemplates/category';
import helpCatalog from '../../../../modules/help';

export default class SeoTemplatesForm extends Form {
	constructor(options) {
		super(options);

		this.productTemplates = null;
		this.categoryTemplates = null;
	}

	getRules() {
		return [
			['product_title, product_metaDescription', 'trim'],
			['product_title, product_metaDescription', 'validateProductTemplates'],

			['category_title, category_metaDescription', 'trim'],
			['category_title, category_metaDescription', 'validateCategoryTemplates'],
		];
	}

	async setupAttrs() {
		const templates = await this.getSetting('system', 'seoTemplates');

		this.setAttributes({
			product_title: templates.product.title,
			product_metaDescription: templates.product.metaDescription,

			category_title: templates.category.title,
			category_metaDescription: templates.category.metaDescription,
		});
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const templates = await this.getSetting('system', 'seoTemplates');
		templates.product = {
			title: attrs.product_title,
			metaDescription: attrs.product_metaDescription
		};

		templates.category = {
			title: attrs.category_title,
			metaDescription: attrs.category_metaDescription
		};

		await this.setSetting('system', 'seoTemplates', templates);
	}

	async validateProductTemplates(value, options, attr) {
		await this.getProductTemplates();

		const fakeData = this.productTemplates.fakeData();
		const preparedData = this.productTemplates.prepareData(fakeData.product, fakeData.variants);

		try {
			this.productTemplates.compile(value, preparedData, true);
		} catch (e) {
			this.addError(attr, 'notValidTemplate', this.__('Template has incorrect syntax.'));
		}
	}

	async validateCategoryTemplates(value, options, attr) {
		await this.getCategoryTemplates();

		let fakeData = this.categoryTemplates.fakeData(),
			preparedData = this.categoryTemplates.prepareData(fakeData)
			;

		try {
			this.categoryTemplates.compile(value, preparedData, true);
		} catch (e) {
			this.addError(attr, 'notValidTemplate', this.__('Template has incorrect syntax.'));
		}
	}

	async getCategoryTemplates() {
		if (!this.categoryTemplates) {
			this.categoryTemplates = new CategorySeoTpl(await this.getEnv());
		}

		return this.categoryTemplates;
	}

	async getProductTemplates() {
		if (!this.productTemplates) {
			this.productTemplates = new ProductSeoTpl(await this.getEnv());
		}

		return this.productTemplates;
	}

	async getTplData() {
		const out = await super.getTplData();

		//@ts-ignore
		out.helpProduct = helpCatalog.get('productSEOTpls');

		return out;
	}
}