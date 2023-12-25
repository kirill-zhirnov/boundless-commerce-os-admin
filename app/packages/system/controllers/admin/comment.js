import BasicAdmin from '../admin';

export default class CommentController extends BasicAdmin {
	async actionCollection() {
		const dataProvider = await this.createDataProvider('@p-system/dataProvider/admin/adminComment');
		const result = await dataProvider.getData();
		return this.json(result);
	}

	actionPost() {
		const formKit = this.createFormKit('@p-system/forms/admin/adminComment', {}, {
			successMsg: false,
			error: formKit => {
				return this.jsonErrors({errors: formKit.form.getFormErrors()});
			}
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			throw new Error('post only!');
		}
	}
}