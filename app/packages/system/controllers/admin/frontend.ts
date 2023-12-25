import BasicAdmin from '../admin';

export default class FrontendSettingsController extends BasicAdmin {
	async actionUrls() {
		const formKit = this.createFormKit('@p-system/forms/admin/frontend', {});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		this.setPage('title', this.__('Frontend Urls'));
		const data = await formKit.getWebForm();

		Object.assign(data, {
			buttons: {
				buttons: ['save']
			}
		});

		this.render('form', data);
	}
}