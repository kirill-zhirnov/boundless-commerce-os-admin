import Widget from '../../../modules/widget/widget.client';
import _ from 'underscore';

export default class LoginNavBar extends Widget {
	initialize() {
		this.cacheKey = 'currentUser';
	}

	attributes() {
		const classes = ['user'];
		classes.push(this.data && this.data.user.isGuest ? 'is-guest' : 'is-logged-in');

		return {
			class: classes.join(' ')
		};
	}

	run() {
		return this.getCurrentUser()
			.then(user => {
				this.data.dropDownId = 'dropdown-user-' + this.getId();
				return this.render('loginNavBar', this.getTplDataByUser(user));
			});
	}

	runLazyInit() {
		this.getWCache().save(this.cacheKey, this.data.user);

		this.listenTo$(document, 'loggedIn.auth', this.reRenderWidget);
		this.listenTo$(document, 'loggedOut.auth', this.reRenderWidget);
	}

	reRenderWidget() {
		this.getWCache().remove(this.cacheKey);

		return this.getCurrentUser()
			.then(user => {
				return this.localRender('loginNavBar', this.getTplDataByUser(user));
			}).then(html => {
				if (this.$el) {
					return this.replace(this.wrapInWrapper(html, false));
				}
			});
	}

	getTplDataByUser(user) {
		if (!this.data) {
			return {};
		}

		const data = this.getMenu(user);

		data.langs = _.extend({
			loggedIn: null
		}, this.data.langs);

		return data;
	}

	getCurrentUser() {
		return this.getWCache()
			.load(this.cacheKey, () => this.makeIsomorphicRequest(this.url('auth/user/current')))
			.then(user => {
				if (this.data != null) {
					this.data.user = user;
				}

				return user;
			});
	}

	getMenu(user) {
		let menu = [];

		if (user.role === 'customer') {
			menu = this.getCustomerMenu();
		} else if (['admin', 'manager'].includes(user.role)) {
			menu = this.getAdminMenu();
		}

		const out = [];
		for (let row of Array.from(menu)) {
			const item = {
				title: row.title
			};

			_.extend(item, _.pick(row, ['attrs', 'icon']));

			if (row.url) {
				if (_.isArray(row.url)) {
					item.url = this.url.apply(this, row.url);
				} else {
					item.url = row.url;
				}
			}

			out.push(item);
		}

		return {
			menu: out
		};
	}

	getCustomerMenu() {
		return [
			// {
			// 	icon: 'list',
			// 	title: this.__('My orders'),
			// 	url: ['@client-dashboard']
			// },
			// {
			// 	icon: 'lock',
			// 	title: this.__('Change password'),
			// 	url: ['auth/me/changePassword'],
			// 	attrs: {
			// 		'data-modal': ''
			// 	}
			// },
			// {
			// 	icon: 'off',
			// 	title: this.__('Log out'),
			// 	url: ['auth/logout/exit']
			// }
		];
	}

	getAdminMenu() {
		return [
			// {
			// 	icon: 'home',
			// 	title: this.__('Dashboard'),
			// 	url: ['@admin-dashboard']
			// },
			{
				icon: 'ico ico_size_21 ico_key',
				title: this.__('Change password'),
				url: ['auth/me/changePassword'],
				attrs: {
					'data-modal': ''
				}
			},
			{
				icon: 'ico ico_size_21 ico_log-out',
				title: this.__('Log out'),
				url: ['auth/logout/exit']
			}
		];
	}

	getFileName() {
		return __filename;
	}
}
