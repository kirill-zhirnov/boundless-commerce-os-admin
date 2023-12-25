import BasicController from '../../../modules/controller/basic';
import errors from '../../../modules/errors/errors';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

export default class ErrorController extends BasicController {
	actionView() {
		let status = 500;
		this.setPage({
			title: `Error ${status}`,
			header: `Error ${status}`
		});

		this.assign('debug', wrapperRegistry.getConfig().debug);
		let error = this.getParam('error');

		if (error) {
			if (error instanceof errors.ActionError) {
				({error} = error);
				this.assign('parsedRoute', error.parsedRoute);

				if (error instanceof errors.HttpError) {
					({status} = error);

					if ((error.status === 403) && this.getUser().isClient()) {
						this.assign('errorAlias', 'clientAccessDenied');
					}
				}
			}

			this.assign('error', error.toJSON());
			this.setPage({
				title: `Error ${status}`,
				header: error.message
			});
		}

		this.getResponse().setStatus(status);
		this.render('view');
	}

	actionUnavailable() {
		this.setPage('title', this.__('Store is temporary suspended.'));
		this.getResponse().setStatus(403);
		this.setLayout('emptyWithContainer');

		this.render('unavailable');
	}
}
