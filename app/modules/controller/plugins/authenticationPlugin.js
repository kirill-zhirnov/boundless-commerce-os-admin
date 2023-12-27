import BasicPlugin from './basicPlugin';
import User from '../../../packages/auth/modules/user';
import CookieAuthentication from '../../../packages/auth/modules/authentication/cookie';

export default class AuthenticationPlugin extends BasicPlugin {
	async onBeforeExpressRun() {
		console.log('--- AuthenticationPlugin.onBeforeExpressRun');
		const user = new User(this.getFrontController().getRequest(), this.getFrontController().getResponse());
		user.setInstanceRegistry(this.getInstanceRegistry());
		user.setClientRegistry(this.getClientRegistry());

		const site = this.getClientRegistry().getSite();
		console.log('--- site:', site);

		const lang = {lang_id: site.default.lang};
		await user.validateSession();

		const cookie = new CookieAuthentication(
			this.getInstanceRegistry(),
			site,
			lang,
			user,
			this.getFrontController().getRequest(),
			this.getFrontController().getResponse()
		);
		user.setPlugin('cookieAuth', cookie);

		this.getClientRegistry().setUser(user);

		if (user.isGuest() && !user.getId())
			await cookie.make();
	}
}