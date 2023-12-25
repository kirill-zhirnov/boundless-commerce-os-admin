import BasicController from '../../../modules/controller/basic';

export default class RestoreController extends BasicController {
	async actionEmail() {
		if (!this.redirectIfNotGuest()) {
			return;
		}

		// const email = this.getParam('email');

		const formKit = this.createFormKit('@p-auth/forms/restoreEmail', {}, {
			successRedirect: this.url('auth/restore/emailSent'),
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			this.htmlClasses.push('layout-v-center no-header');
			this.setPage({
				title: this.__('Password restore'),
				robots: 'noindex'
			});

			const data = await formKit.getWebForm();

			this.render('email', data);
		}
	}

	async actionPassword() {
		if (!this.redirectIfNotGuest()) {
			return;
		}

		const tokenParams = {
			tokenId: this.getParam('tokenId'),
			token1: this.getParam('token1'),
			token2: this.getParam('token2')
		};

		const formKit = this.createFormKit('@p-auth/forms/restorePassword', {
			tokenParams
		}, {
			success: () => {
				this.alertSuccess(this.__('Password was successfully changed.'));
				this.triggerClient('loggedIn.auth', this.getUser().getPublicStates());

				const session = this.getSession();
				delete session.passRestore;

				return this.redirect(this.getUser().getUrlAfterSignIn());
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			this.htmlClasses.push('layout-v-center no-header');
			this.setPage({
				title: this.__('Password restore'),
				robots: 'noindex'
			});

			const data = await formKit.getWebForm();

			this.render('password', data);
		}
	}

	actionEmailSent() {
		if (!this.redirectIfNotGuest()) {
			return;
		}

		this.setPage({
			title: this.__('Password recovery mail')
		});

		const session = this.getSession();

		const data = {
			emailIsSent: false,
			email: null
		};

		if ((session.passRestore != null) && (session.passRestore.emailIsSent != null)) {
			data.emailIsSent = true;
			data.email = session.passRestore.email;
		}

		this.htmlClasses.push('layout-v-center no-header');
		this.setPage('robots', 'noindex');
		this.render('emailSent', data);
	}

	redirectIfNotGuest() {
		if (!this.getUser().isGuest()) {
			this.redirect([this.getUser().getHomeRoute()]);
			return false;
		}

		return true;
	}
}