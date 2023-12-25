import BasicController from '../../../modules/controller/basic';

export default class LogoutController extends BasicController {
	actionExit() {
		if (!this.getUser().isGuest()) {
			this.getUser().logout();
		}

		this.triggerClient('loggedOut.auth');
		return this.redirect(['/']);
	}
}