import BasicAdmin from '../../../../system/controllers/admin';
import ProductSeoTpl from '../../../../catalog/modules/seoTemplates/product';

export default class SeoController extends BasicAdmin {
	async actionCompile() {
		let productTemplates = new ProductSeoTpl(await this.getEnv());

		this.json(
			await productTemplates.compileByProductId(this.getParam('id'))
		);
	}
}