import BasicController from '../../../modules/controller/basic';

export default class UserController extends BasicController {
	actionCurrent() {
		const user = this.getUser();

		let out = {isGuest: true};
		if (!user.isGuest()) {
			const profile = user.getState('profile');

			out = {
				id: user.getId(),
				email: profile.email,
				isGuest: false,
				role: 'customer',
				settings: {
					adminCloseModal: user.getSetting('adminCloseModal')
				}
			};

			if (user.isAdmin()) {
				out.role = 'admin';
			} else if (user.hasManagersRole()) {
				out.role = 'manager';
			}
		}

		this.json(out);
	}
}
