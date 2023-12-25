import BasicController from '../../../modules/controller/basic';

export default class MeController extends BasicController {
	async actionChangePassword() {
		const formKit = this.createFormKit('@p-auth/forms/changePassword', {}, {
			successMsg: this.__('Password was successfully changed.')
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal('changePassword', data, this.__('Change password'));
		}
	}
}