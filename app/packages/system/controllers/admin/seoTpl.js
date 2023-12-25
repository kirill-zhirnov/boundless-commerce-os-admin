import BasicAdmin from '../admin';
import ProductSeoTpl from '../../../catalog/modules/seoTemplates/product';
import CategorySeoTpl from '../../../catalog/modules/seoTemplates/category';

export default class SeoTplController extends BasicAdmin {
	// async actionForm() {
	// 	let formKit = this.createFormKit('@p-system/forms/admin/seoTemplates', {}, {
	// 		successMsg: false
	// 	});
	//
	// 	if (this.isSubmitted()) {
	// 		formKit.process();
	// 	} else {
	// 		let data = await formKit.getWebForm();
	//
	// 		this.modal('form', {data}, this.__('SEO templates'));
	// 	}
	// }

	async actionCompile() {
		let productTemplates = new ProductSeoTpl(await this.getEnv()),
			fakeData = productTemplates.fakeData(),
			preparedData = productTemplates.prepareData(fakeData.product, fakeData.variants)
			;

		let out = {};
		['product_title', 'product_metaDescription'].forEach((attr) => {
			let tpl = this.getParam(attr, '');

			try {
				out[attr] = productTemplates.compile(tpl, preparedData, true);
			} catch (e) {
				out[attr] = '';
			}
		});

		let categoryTemplates = new CategorySeoTpl(await this.getEnv()),
			categoryFakeData = categoryTemplates.fakeData(),
			categoryPreparedData = categoryTemplates.prepareData(categoryFakeData)
			;

		['category_title', 'category_metaDescription'].forEach((attr) => {
			let tpl = this.getParam(attr, '');

			try {
				out[attr] = categoryTemplates.compile(tpl, categoryPreparedData, true);
			} catch (e) {
				out[attr] = '';
			}
		});

		this.json({
			result: true,
			compiled: out
		});
	}
}