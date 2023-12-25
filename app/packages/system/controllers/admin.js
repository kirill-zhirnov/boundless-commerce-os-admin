import BasicController from '../../../modules/controller/basic';

export default class BasicAdminController extends BasicController {
	init() {
		this.setLayout('admin');
		this.systemPart = 'backend';

		return super.init();
	}
}