import BasicForm from '../../../modules/form';
import AuthPlain from '../modules/authentication/plain';

export default class PlainAuth extends BasicForm {
	getRules() {
		return [
			['email, pass', 'required'],
			['email', 'isEmail'],
			['pass', 'login'],
			['rememberMe', 'safe']
		];
	}

	async validate() {
		const result = await super.validate();

		this.triggerClient('loggedIn.auth', this.getUser().getPublicStates());

		return result;
	}

	async login(value, options, field, attributes) {
		const user = this.controller.getUser();
		const auth = new AuthPlain(this.getInstanceRegistry(), attributes.email, attributes.pass, this.getSite(), this.getLang(), user);

		const result = await auth.make();
		if (!result) {
			this.addError(field, 'login', this.__('Incorrect email or password'));
		} else {
			if (attributes.rememberMe === '1') {
				//@ts-ignore
				await user.getPlugin('cookieAuth').createAndSetToken();
			}
		}
	}
}