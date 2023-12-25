import BasicUser from '../../../modules/authentication/user';
import IdAuthentication from '../modules/authentication/id';
import CookieAuthentication from '../modules/authentication/cookie';
import _ from 'underscore';

export default class User extends BasicUser {
	static initClass() {
		this.GUEST_BUYER_ROLE = 'guest-buyer';
	}

	constructor() {
		super(...arguments);

		//	    FIXME: DO NOT USE IT!!!
		//	    https://trello.com/c/V0f8AiHp/155-class-user
		this.clientRegistry = null;
		this.instanceRegistry = null;
		this.db = null;
	}

	getSetting(key, defaultValue = null) {
		const settings = this.getState('settings');

		if (key in settings) {
			return settings[key];
		} else {
			return defaultValue;
		}
	}

	async setSetting(key, val) {
		if (this.isGuest()) {
			throw new Error('You cannot modify settings for guest!');
		}

		const settings = this.getState('settings');
		settings[key] = val;

		await this.updateSettings(settings);
	}

	async validateSession() {
		const userId = this.session?.user?.id || null;
		if (!userId) return;

		const user = await this.db.model('person').findOne({
			where: {
				person_id: userId,
				deleted_at: null,
				status: 'published'
			}
		});

		if (!user) delete this.session.user;
	}

	rmSetting(key) {
		if (this.isGuest()) {
			throw new Error('You cannot modify settings for guest!');
		}

		const settings = this.getState('settings');
		delete settings[key];

		return this.updateSettings(settings);
	}

	async updateSettings(settings) {
		this.setState('settings', settings);

		await this.db.sql(`
			update
				person_settings
			set
				settings = :settings
			where
				person_id = :id
		`, {
			id: this.getId(),
			settings: JSON.stringify(settings)
		});
	}

	isGuest() {
		return !(this.session && this.session[this.key] && this.session[this.key].id)
			|| !this.getState('registered_at')
			|| !this.hasManagersRole()
		;
	}

	isGuestBuyer() {
		return this.hasRole(User.GUEST_BUYER_ROLE);
	}

	setClientRegistry(clientRegistry) {
		this.clientRegistry = clientRegistry;
		return this;
	}

	setInstanceRegistry(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.db = this.instanceRegistry.getDb();

		return this;
	}

	//	FIXME: DO NOT USE IT!!!
	//	https://trello.com/c/V0f8AiHp/155-class-user
	getClientRegistry() {
		if (!this.clientRegistry) {
			throw new Error('You must specify client registry before calling this func!');
		}

		return this.clientRegistry;
	}

	async makeGuestVisitor(authUser = true) {
		if (!this.isGuest()) {
			throw new Error('User is not a guest!');
		}

		if (this.getId()) {
			return this.getId();
		}

		// let userAgent = null;
		// if ('user-agent' in this.request.headers) {
		// 	userAgent = this.request.headers['user-agent'];
		// }

		const person = await this.db.model('person').createGuestVisitor(this.getClientRegistry().getSite().site_id);
		if (authUser) {
			await this.authById(person.person_id);
		}

		return person.person_id;
	}

	async makeGuestBuyer() {
		const personId = await this.makeGuestVisitor(false);
		await this.db.model('role').setGuestBuyerRoles(personId);
		await this.authById(personId);

		return personId;
	}

	// searches for person, which are not registered with given email (email=email and registered_at is null)
	// if email is already registered - returns false
	async makeUnregisteredCustomerByEmail(email) {
		const person = await this.db.model('person').findOrCreateUnregistered(this.getClientRegistry().getSite().site_id, email);
		if (person) {
			await this.db.model('role').setGuestBuyerRoles(person.person_id);
		}

		if (person) {
			await this.authById(person.person_id);
		}

		return person;
	}

	async authById(personId, setCookie = true) {
		const site = this.getClientRegistry().getSite();
		const lang = this.getClientRegistry().getLang();

		const auth = new IdAuthentication(this.instanceRegistry, personId, site, lang, this);
		await auth.make();

		return this.setCookieAuthToken();
	}

	setCookieAuthToken() {
		const site = this.getClientRegistry().getSite();
		const lang = this.getClientRegistry().getLang();

		const cookieAuth = new CookieAuthentication(this.instanceRegistry, site, lang, this, this.request, this.response);
		return cookieAuth.createAndSetToken();
	}

	getHomeRoute() {
		let route;
		if (this.hasRole('admin')) {
			route = '@admin-dashboard';
		} else if (this.hasRole('client')) {
			route = '@client-dashboard';
		}  else if (this.hasRole('content-manager')) {
			route = '@client-manager-dashboard';
		}  else if (this.hasRole('orders-manager')) {
			route = '@orders-manager-dashboard';
		} else {
			route = '/';
		}

		return route;
	}

	getUrlAfterSignIn() {
		const url = this.getBlockedRoute();

		if (this.hasRole('admin') && url) {
			return url;
		}

		return [this.getHomeRoute()];
	}

	getPublicStates() {
		let out = {id: this.getId()};

		if (this.session[this.key]?.states?.profile) {
			Object.assign(out, _.pick(this.session[this.key].states.profile, [
				'email',
				'country_id',
				'country_title',

				'first_name',
				'last_name',
				'phone'
			]));
		}

		return out;
	}

	// need to properly reload states
	// don't need to set cookie, since it should be already set
	async reLoadStates() {
		if (!this.getId()) {
			throw new Error('Method only for users with ID');
		}

		const site = this.getClientRegistry().getSite();
		const lang = this.getClientRegistry().getLang();

		const auth = new IdAuthentication(this.instanceRegistry, this.getId(), site, lang, this);
		const userStates = await auth.getUser();

		this.updateUser(userStates.roles, userStates.states);
	}

	isOwner() {
		if (this.isAdmin()) {
			return this.getState('is_owner', false);
		}

		return false;
	}
}

User.initClass();