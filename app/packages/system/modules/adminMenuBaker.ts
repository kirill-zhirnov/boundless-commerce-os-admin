import JedExtended from '../../../modules/i18n/jed.client';
import _ from 'underscore';
import utils from '../../../modules/utils/common.client';
import {IBasicRouter} from '../../../@types/router/router';
import {TRoleAlias} from '../../../@types/person';

const iconBasicClass = 'ico ico_size_19';

export default class AdminMenuBaker {
	protected currentMenuUrl: string | null = null;

	constructor(
		protected i18n: JedExtended,
		protected router: IBasicRouter,
		protected userRoles: TRoleAlias[] = []
	) {
	}

	makeMenu(type: TMenuType) {
		let rawMenu: IRawMenuItem[] | undefined;
		switch (type) {
			case TMenuType.main:
				rawMenu = this.getRawMain();
				break;
			case TMenuType.settings:
				rawMenu = this.getRawSettings();
				break;
		}

		return this.prepareMenu(rawMenu);
	}

	prepareMenu(menu: IRawMenuItem[]): {menu: IMenuItem[], hasActive: boolean} {
		const out = [];
		let hasActive = false;
		for (const row of menu) {
			if (
				!this.userRoles.includes(TRoleAlias.Admin) &&
				(row.roles && this.userRoles.every(role => !row.roles.includes(role)))
			) {
				continue;
			}

			let children;
			const item: IMenuItem = {};
			if (row.type === 'hr') {
				item.type = row.type;
			} else {
				Object.assign(item, {
					title: row.title,
					isActive: false
				});
			}

			Object.assign(item, _.pick(row, ['attrs', 'faIcon', 'customIcon']));

			if (row.url) {
				if (Array.isArray(row.url)) {
					// @ts-ignore
					item.url = this.router.url(...row.url);
				} else {
					item.url = row.url;
				}
			}

			if (row.children) {
				children = this.prepareMenu(row.children);
				item.children = children.menu;
			}

			if ((item.url && utils.isCurrentMenu(this.currentMenuUrl, item.url)) || (row.children && children.hasActive)) {
				item.isActive = true;
				hasActive = true;
			}

			out.push(item);
		}

		return {
			menu: out,
			hasActive
		};
	}

	setCurrentMenuUrl(value: string | null) {
		this.currentMenuUrl = value;
		return this;
	}

	getRawMain(): IRawMenuItem[] {
		return [
			{
				customIcon: `${iconBasicClass} ico_home`,
				url: ['dashboard/admin/index'],
				title: this.__('Home'),
				roles: [TRoleAlias.Admin]
			},
			{
				customIcon: `${iconBasicClass} ico_shopping-cart`,
				title: this.__('Orders'),
				url: ['orders/admin/orders/index'],
				roles: [TRoleAlias.OrdersManager]
			},
			{
				customIcon: `${iconBasicClass} ico_grid`,
				title: this.__('Catalog'),
				roles: [TRoleAlias.ContentManager],
				children: [
					{
						url: ['catalog/admin/product/index'],
						customIcon: `${iconBasicClass} ico_tshirt-v-outline`,
						title: this.__('Products')
					},
					{
						url: ['catalog/admin/category/index'],
						customIcon: `${iconBasicClass} ico_folder`,
						title: this.__('Categories')
					},
					{
						url: ['catalog/admin/import/index'],
						title: this.__('Import'),
						customIcon: `${iconBasicClass} ico_excel`,
					},
					{
						url: ['catalog/admin/commodityGroup/index'],
						title: this.__('Product Types'),
						customIcon: `${iconBasicClass} ico_group`,
					},
					{
						url: ['catalog/admin/label/index'],
						title: this.__('Labels'),
						customIcon: `${iconBasicClass} ico_tag`,
					},
					{
						url: ['catalog/admin/manufacturer/index'],
						title: this.__('Manufacturers'),
						customIcon: `${iconBasicClass} ico_store-outline`,
					},
					{
						url: ['catalog/admin/collection/index'],
						title: this.__('Collections'),
						customIcon: `${iconBasicClass} ico_layers`,
					},
				]
			},
			{
				title: this.__('Inventory'),
				customIcon: `${iconBasicClass} ico_package`,
				roles: [TRoleAlias.ContentManager],
				children: [
					{
						url: ['inventory/admin/warehouse/index'],
						title: this.__('Warehouses')
					},

					{
						url: ['inventory/admin/stockPerWarehouse/index'],
						title: this.__('Stock per warehouse')
					},

					{
						url: ['inventory/admin/history/changeQty/index'],
						title: this.__('History of changes'),
					},
				]
			},
			{
				customIcon: `${iconBasicClass} ico_users`,
				title: this.__('Customers'),
				url: ['customer/admin/customer/index'],
				roles: [TRoleAlias.Admin]
			},
			{
				customIcon: `${iconBasicClass} ico_percent`,
				title: this.__('Discounts'),
				roles: [TRoleAlias.OrdersManager],
				children: [
					{
						url: ['orders/admin/discount/codes/index'],
						title: this.p__('discount', 'Codes')
					},

					{
						url: ['orders/admin/setup/discount/index'],
						title: this.__('Shipping discounts')
					},
				]
			},
			{
				customIcon: `${iconBasicClass} ico_rss`,
				title: this.__('Product Feeds'),
				url: ['catalog/admin/feeds/index'],
				roles: [TRoleAlias.Admin]
			}
		];
	}

	getRawSettings(): IRawMenuItem[] {
		return [
			{
				title: this.__('Settings'),
				customIcon: `${iconBasicClass} ico_settings`,
				roles: [TRoleAlias.Admin],
				children: [
					{
						title: this.__('My account'),
						url: ['system/sellios/account/index'],
						faIcon: 'cloud'
					},

					{
						type: 'hr'
					},

					// {
					// 	title: this.__('Domains'),
					// 	url: ['system/admin/domain/index'],
					// 	faIcon: 'globe'
					// },

					{
						title: this.__('Locale'),
						url: ['system/admin/site/locale'],
						faIcon: 'language'
					},

					// {
					// 	title: this.__('Store requisites'),
					// 	url: ['system/admin/company/requisites']
					// },

					{
						url: ['catalog/admin/filter/index'],
						title: this.__('Catalog filter sets'),
						customIcon: `${iconBasicClass} ico_filter`,
					},

					{
						url: ['system/admin/cms/seo'],
						title: this.__('SEO templates'),
						faIcon: 'google',
					},
					{
						url: ['system/admin/mail/settings'],
						title: this.__('Email settings'),
						faIcon: 'envelope-open',
					},

					// {
					// 	url: ['system/admin/analytics/settings'],
					// 	// icon: 'signal',
					// 	title: this.__('Analytics')
					// },

					{
						url: ['orders/admin/setup/delivery/settings'],
						title: this.__('Shipping methods'),
						faIcon: 'truck'
					},
					{
						url: ['payment/admin/paymentMethod/index'],
						title: this.__('Payment methods'),
						faIcon: 'credit-card-alt'
					},
					{
						url: ['system/admin/tax/index'],
						title: this.__('Tax settings'),
						// faIcon: 'credit-card-alt'
					},
					{
						type: 'hr'
					},
					{
						title: this.__('Checkout settings'),
						url: ['orders/admin/setup/order/form'],
						faIcon: 'shopping-cart'
					},
					{
						title: this.__('Order Email Notifications'),
						url: ['orders/admin/setup/notification/settings'],
						faIcon: 'bell'
					},
					{
						url: ['orders/admin/setup/orderStatus/index'],
						title: this.__('Order statuses'),
						faIcon: 'list-ul',
					},
					{
						type: 'hr'
					},
					// {
					// 	title: this.__('SMS Notifications'),
					// 	url: ['orders/admin/setup/sms/settings'],
					// 	// icon: 'envelope'
					// },

					// {
					// 	url: ['catalog/admin/settings/form'],
					// 	title: this.__('Catalog Settings'),
					// 	// icon: 'folder-open'
					// },

					// {
					// 	url: ['inventory/admin/option/changeQty/index'],
					// 	title: this.__('Change qty reasons list'),
					// },

					// {
					// 	url: ['system/admin/agreement/form'],
					// 	title: this.__('User agreement'),
					// },

					{
						url: ['auth/admin/token/index'],
						title: this.__('Access tokens'),
						faIcon: 'key',
					},
					{
						url: ['system/admin/webhook/index'],
						title: this.__('Webhooks'),
						faIcon: 'external-link',
					},
					{
						type: 'hr'
					},
					{
						url: ['system/admin/frontend/urls'],
						title: this.__('Frontend Urls'),
						// icon: 'link',
					},

					{
						url: ['auth/admin/users/index'],
						title: this.__('Admin users'),
						faIcon: 'user',
					},

					{
						url: ['system/admin/cleanUp/index'],
						title: this.__('Clean database'),
						faIcon: 'trash',
						attrs: {
							'data-modal': ''
						}
					},
				]
			},
		];
	}

	__(key: string, variables: string[] = []): string {
		return this.i18n.__(key, variables);
	}

	p__(context: string, key: string, variables: string[] = []): string {
		return this.i18n.p__(context, key, variables);
	}
}

export enum TMenuType {
	main = 'main',
	settings = 'settings'
}

export interface IMenuItem {
	title?: string;
	isActive?: boolean;
	attrs?: {[key: string]: any};
	faIcon?: string;
	customIcon?: string;
	url?: string;
	children?: IMenuItem[];
	type?: 'hr';
}

export interface IRawMenuItem {
	customIcon?: string;
	faIcon?: string;
	title?: string;
	url?: (string | {[key: string]: any})[];
	children?: IRawMenuItem[];
	attrs?: {[key: string]: any};
	roles?: TRoleAlias[];
	type?: 'hr'
}