import BasicPlugin from './basicPlugin';
import errors from '../../errors/errors';
import Authorization from '../../authorization/index';

export default class AuthorizationPlugin extends BasicPlugin {
	async onBeforeActionRun(controller) {
//		do not check auth for sub-requests
		if (!controller.getIsInternal()) {
			if (!await this.isAllowed(controller.getAuthResource())) {
//				if user is guest - save blocked route and redirect to login form.
				if (this.getUser().isGuest()) {
					this.getUser().setBlockedRoute(this.getFrontController().getRequest().url);

					const answer = this.makeAnswer();
					answer.redirect(controller.url('@login'));
					return answer;
				} else {
					throw new errors.HttpError(403, 'Forbidden');
				}
			}
		}
	}

	async isAllowed(resource) {
		const authorization = new Authorization(this.getInstanceRegistry());
		return authorization.isAllowed(this.getUser().getRoles(), resource.resource, resource.task);
	}

	getUser() {
		return this.getFrontController().getClientRegistry().getUser();
	}
}