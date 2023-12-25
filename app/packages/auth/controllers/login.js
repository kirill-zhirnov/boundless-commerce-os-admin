import BasicController from '../../../modules/controller/basic';
import * as authUrl from '../modules/authUrl';
// import gHtml from '../../../modules/gHtml/index.client';

export default class LoginController extends BasicController {
	async actionForm() {
		if (!this.getUser().isGuest()) {
			this.redirect([this.getUser().getHomeRoute()]);
			return;
		}

		if (this.isSubmitted()) {
			await this.createFormKit('@p-auth/forms/plainAuth')
				.success(() => {
					this.redirect(this.getUser().getUrlAfterSignIn());
				})
				.process();
		} else {
			this.htmlClasses.push('layout-v-center no-header');
			this.setPage({
				title: this.p__('checkout', 'Sign In'),
				robots: 'noindex'
			});
			this.render('form', {
				wixInstance: Boolean(this.getInstanceRegistry().getInstanceInfo().wix_instance_id)
			});
		}
	}

	async actionByUrl() {
		const result = await authUrl.validate(this);

		if (result !== false) {
			this.redirect(result);
		} else {
			this.rejectHttpError(403, this.getI18n().__('Access deny'));
		}
	}

	async actionTestCookie() {
		const req = this.getFrontController().getRequest();
		const signedCookies = JSON.stringify(req.signedCookies);

		this.html(`
			signedCookies:  ${signedCookies},
			req.secure: ${req.secure},
			req.protocol: ${req.protocol},
			req.hostname: ${req.hostname},
			req.headers['x-forwarded-for']: ${req.headers['x-forwarded-for']}
		`);
	}

	async actionSetTestCookie() {
		this.getFrontController().getResponse().cookie('test_setting', 'aaa', {
			httpOnly: true,
			signed: true,
			maxAge: 86400000 * 365, // 365 days,
			sameSite: 'none',
			secure: true
		});

		this.redirect(['auth/login/testCookie']);
	}
}