import BasicAdmin from '../../../../system/controllers/admin';

export default class CharacteristicController extends BasicAdmin {
	//	Form, which loads if Tab with characteristics is requested.
	async getActionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/product/groupAndCharacteristics');

		const data = await formKit.getWebForm();
		this.json(data);
	}

	//	Characteristics that loads if commodity group is changed.
	async postActionOnGroupChange() {
		const formKit = this.createFormKit('@p-catalog/forms/product/groupAndCharacteristics/characteristics');

		await formKit.getForm();
		await formKit.setupAttributes();
		const data = await formKit.getWebForm();
		this.json(data);
	}
}