import _ from 'underscore';
import extend from 'extend';

export default class User {
	static initClass() {
		this.GUEST_ROLE = 'guest';
		this.ADMIN_ROLE = 'admin';
		this.CLIENT_ROLE = 'client';
		this.ORDERS_MANAGER_ROLE = 'orders-manager';
		this.CONTENT_MANAGER_ROLE = 'content-manager';
	}

	constructor(request, response, key = 'user') {
		this.request = request;
		this.response = response;

		this.key = key;
		this.session = {};
		this.plugins = {};
		this.listeners = {};

		if (this.request) {
			this.session = this.request.session;
		}
	}

	isGuest() {
		return !(this.session && this.session[this.key] && this.session[this.key].id);
	}

	isAdmin() {
		return this.hasRole(User.ADMIN_ROLE);
	}

	hasManagersRole() {
		const roles = this.getRoles();

		return (
			roles.includes(User.ADMIN_ROLE)
			|| roles.includes(User.ORDERS_MANAGER_ROLE)
			|| roles.includes(User.CONTENT_MANAGER_ROLE)
		);
	}

	isClient() {
		return this.hasRole(User.CLIENT_ROLE);
	}

	getRoles() {
		if (this.session && this.session[this.key] && Array.isArray(this.session[this.key].roles) && this.session[this.key].roles.length) {
			return this.session[this.key].roles;
		}

		return [User.GUEST_ROLE];
	}

//	get Active Record instance for given user
	getId() {
		if (!(this.session[this.key] != null ? this.session[this.key].id : undefined)) {
			return false;
		}

		return this.session[this.key].id;
	}

	setUser(id, roles, states = {}) {
		let prevUser;
		if (!this.session[this.key]) {
			this.session[this.key] = {};
			prevUser = null;
		} else {
			prevUser = extend(true, {}, this.session[this.key]);
		}

		this.session[this.key]['id'] = id;
		this.updateUser(roles, states);

		this.emit('setUser', prevUser, this.session[this.key]);
	}

	updateUser(roles, states = {}) {
		if (!Array.isArray(roles)) {
			throw new Error('Roles must be an array!');
		}

		this.session[this.key]['roles'] = roles;

		for (let key in states) {
			const val = states[key];
			this.setState(key, val);
		}

		return this;
	}

	getState(key, defVal = null) {
		if (!this.session) {
			throw new Error('You must setup session before calling getState method!');
		}

		if (!this.session[this.key] || !this.session[this.key].states || !(key in this.session[this.key].states)) {
			return defVal;
		}

		return this.session[this.key].states[key];
	}

	setState(key, val) {
		if (!this.session) {
			throw new Error('You must setup session before calling setState method!');
		}

		if (!this.session[this.key]) {
			this.session[this.key] = {};
		}

		if (!this.session[this.key].states) {
			this.session[this.key].states = {};
		}

		this.session[this.key].states[key] = val;

		return this;
	}

	logout() {
		const prevUser = extend(true, {}, this.session[this.key]);

		if (this.session) {
			this.session[this.key] = null;
		}

		this.emit('logout', prevUser);
		this.triggerPluginEvent('onLogout');

		return this;
	}

	setBlockedRoute(route) {
		return this.setState('blockedRoute', route);
	}

	getBlockedRoute() {
		return this.getState('blockedRoute');
	}

	setPlugin(name, instance) {
		this.plugins[name] = instance;

		return this;
	}

	getPlugin(name) {
		return this.plugins[name];
	}

	async triggerPluginEvent(eventName, args = []) {
		args.unshift(this);

		for (const [name, instance] of Object.entries(this.plugins)) {
			if (_.isFunction(instance[eventName])) {
				await instance[eventName](...args);
			}
		}
	}

	hasRole(role) {
		return this.getRoles().indexOf(role) !== -1;
	}

	destroy() {
		this.removeAllListeners();
		this.plugins = {};
	}

	on(eventName, callback) {
		if (!(eventName in this.listeners)) {
			this.listeners[eventName] = [];
		}

		this.listeners[eventName].push(callback);

		return this;
	}

	removeAllListeners() {
		this.listeners = {};

		return this;
	}

	async emit() {
		const [eventName, ...args] = Array.from(arguments);

		if (Array.isArray(this.listeners[eventName])) {
			for (const callback of this.listeners[eventName]) {
				await callback(...args);
			}
		}
	}
}

User.initClass();
