import BasicAdmin from '../../../../system/controllers/admin';

export default class AdditionsController extends BasicAdmin {
	async getActionTab() {
		let formGroup = this.createFormsGroup({
			yml: '@p-catalog/forms/product/yml'
		});

		this.json(
			await formGroup.getWebForms()
		);
	}
}