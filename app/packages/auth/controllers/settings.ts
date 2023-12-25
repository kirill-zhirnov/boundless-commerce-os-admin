import BasicAdminController from '../../system/controllers/admin';

export default class UserSettingsController extends BasicAdminController {
	async actionAdminLeftSidebar() {
		let value = this.getParam('value');
		if (!['full', 'short'].includes(value)) {
			value = 'full';
		}

		await this.getUser().setSetting('leftSideBar', value);
		this.json(true);
	}
}