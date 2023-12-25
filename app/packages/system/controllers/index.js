import BasicController from '../../../modules/controller/basic';

export default class IndexController extends BasicController {
	async actionIndex() {
		if (this.getUser().isGuest()) {
			this.redirect(['auth/login/form']);
		} else {
			let homeRoute = this.getUser().getHomeRoute();
			if (homeRoute === '/') {
				homeRoute = '@admin-dashboard';
			}

			this.redirect([homeRoute]);
		}
		// this.render('test');
		// this.getFrontController().getResponse()
		// 	.send('this is an answer from the system controller!');

	// 	return this.getRegistry().getSettings().get('cms', 'mainPage')
	// 	.then(page => {
	// 		if (page.mainPage != null) {
	// 			const viewAction = new PageView(this);
	// 			return viewAction.proceed(page.mainPage, true);
	//
	// 		} else {
	// 			this.setPage(page);
	// 			this.setLayout('mainPage');
	// 			this.setResponseType('layout');
	//
	// 			this.getResponse().setWrapperData('canonical', this.url('/', {}, true));
	// 			if (this.getParam('layoutEditMode') !== null) {
	// 				this.setPage('robots', 'noindex');
	// 			}
	//
	// 			this.setPage('aos', true);
	//
	// 			return this.resolve();
	// 		}
	// }).done();
	}
}