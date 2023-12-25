import BasicAdmin from '../../../../system/controllers/admin';
import CategorySeoTpl from '../../../modules/seoTemplates/category';

export default class CategorySeoController extends BasicAdmin {
	async actionCompile() {
		//@ts-ignore
		let categoryInfo = await this.getModel('category').loadCategory(
			this.getEditingSite().site_id,
			this.getEditingLang().lang_id,
			this.getParam('id'),
		);

		if (!categoryInfo) {
			this.rejectHttpError(404, 'Not found');
			return;
		}

		let categoryTemplates = new CategorySeoTpl(await this.getEnv());

		this.json(
			await categoryTemplates.compileByCategoryRow(categoryInfo)
		);
	}
}