import GridWidget from '../../system/widgets/grid.client';
import bs from '../../../modules/gHtml/bs.client';
import gHtml from '../../../modules/gHtml/index.client';
import _ from 'underscore';
import escape from 'escape-html';
import {copyEl2Clipboard} from '../../../modules/utils/copy';
import bundles from '../../../modules/utils/bundles.client';
import $ from 'jquery';

export default class CustomerGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('customer/admin/customer/collection');
		this.formMode = 'page';
		this.wrapperTpl = {
			type: 'widget',
			file: 'customerGridWrapper',
			package: 'customer'
		};

		this.export = ['excel'];
		this.idAttribute = 'person_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Name'),
				name: 'user',
				clickable: false,
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					const user = model.toJSON();
					let out = '';
					let name = _.compact(_.values(_.pick(user, ['first_name', 'last_name'])));
					name = name.length ? escape(name.join(' ')) : '&nbsp;';
					out += gHtml.tag('p', {class: 'name'}, this.wrapInLink(name, model));

					let right = '';
					if (user.email) {
						right += gHtml.tag(
							'p',
							{class: 'text-end small text-nowrap'},
							`${gHtml.link(`${gHtml.faIcon('envelope-o')} ${user.email}`, `mailto:${user.email}`)} ${gHtml.link(gHtml.faIcon('copy'), '#', {class: 'addr-copy-icon'})}`
						);
					}

					if (user.phone) {
						right += gHtml.tag(
							'p',
							{class: 'text-end small text-nowrap phone-number'},
							`${gHtml.link(`${gHtml.faIcon('phone')} ${gHtml.tag('span', {class: 'masked-phone'}, user.phone)}`, `tel:${user.phone}`)} ${gHtml.link(gHtml.faIcon('copy'), '#', {class: 'addr-copy-icon'})}`
						);
					}

					if (user.registered_at) {
						right += gHtml.tag('p', {class: 'text-end small text-nowrap'}, `${gHtml.faIcon('user')} ${this.__('Registered Customer')}`);
					}

					if (user.receive_marketing_info) {
						right += gHtml.tag('p', {class: 'text-end small text-nowrap'}, `${gHtml.faIcon('check-square-o')} ${this.__('Subscribed')}`);
					}
					//
					// if (user.role_aliases.indexOf('admin') !== -1) {
					// 	right += gHtml.tag('p', {class: 'system small text-muted'}, this.__('Administrator'));
					// }

					out += `<p class="text-muted small">ID: ${user.person_id}</p>${right}`;
					return out;
				},

				filter: () => {
					return bs.textField(this.data.attrs, 'user', {
						placeholder: this.__('Name, surname, email, or phone'),
						class: 'form-control-sm'
					});
				}
			},

			{
				label: this.__('Total spend'),
				name: 'orders_sum',
				clickable: this.isClickable,
				cell: 'html',
				customClass: 'text-center',
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = '0';
					if (model.get('total_orders_qty')) {
						out = gHtml.tag('p', {}, this.getLocale().formatMoney(model.get('total_orders_sum')));
						out += gHtml.tag('div', {class: 'text-muted small'}, `${this.__('Total orders:')} ${model.get('total_orders_qty')}`);
					}

					return out;
				}
			},
			{
				label: this.__('Address'),
				name: 'country_id',
				clickable: this.isClickable,
				cell: 'html',
				customClass: 'text-center',
				filter: {
					type: 'select',
					options: this.data.options.country
				},
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = gHtml.tag('p', {}, model.get('country_title'));

					if (model.get('city')) {
						out += gHtml.tag('p', {class: 'mb-0'}, `${model.get('city')}, ${model.get('state') || ''}`);
					}
					if (model.get('address_line_1')) {
						out += gHtml.tag('p', {class: 'mb-0'}, model.get('address_line_1'));
					}
					if (model.get('address_line_2')) {
						out += gHtml.tag('p', {}, model.get('address_line_2'));
					}

					return out;
				}
			},
			{
				label: this.__('Groups'),
				name: 'group_id',
				// name: 'address',
				clickable: this.isClickable,
				cell: 'html',
				customClass: 'text-center',
				sortable: false,
				filter: {
					type: 'select',
					options: this.data.options.groups
				},
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = '';
					if (Array.isArray(model.get('groups'))) {
						out = model.get('groups').join('<br/>');
					}

					return out;
				}
			},

			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'}
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					if (model.get('deleted_at') != null) {return 'removed';} else {return 'normal';}
				}
			}
		];

		this.bulkButtons = {
			buttons: {
				//@ts-ignore
				normal: [
					{type: 'rm'}
				],
				removed: [
					{type: 'restore'}
				]
			},

			scope: () => {
				const models = this.htmlView.getCheckedModels(true);
				if (models[0] && (models[0].get('deleted_at') != null)) {
					return 'removed';
				}

				return 'normal';
			}
		};
	}

	events() {
		return Object.assign(super.events(), {
			'click .addr-copy-icon': (e) => {
				e.preventDefault();
				copyEl2Clipboard($(e.currentTarget).prev().get(0));
			}
		});
	}

	wrapInLink(content, model) {
		const attrs = {};
		if (!model.get('deleted_at')) {
			attrs.href = this.url('customer/admin/customer/form', {pk: model.get('person_id'), grid: this.collection.serializeStates()});
		}

		return gHtml.tag('a', attrs, content);
	}

	async runLazyInit() {
		await super.runLazyInit();
		await bundles.load('clientUI');

		this.listenTo(this.collection, 'backgrid:refresh', () => {
			//@ts-ignore
			this.$('.masked-phone').maskPhone();
		});

		//@ts-ignore
		this.$('.masked-phone').maskPhone();
	}

	//@ts-ignore
	className() {
		return 'grid-widget customer-grid';
	}

	isClickable(model) {
		if (model.get('deleted_at') != null) {return false;} else {return true;}
	}

	remove() {
		//@ts-ignore
		this.$('.masked-phone').unmask();

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}