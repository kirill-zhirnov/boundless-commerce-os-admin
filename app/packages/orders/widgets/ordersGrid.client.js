import GridWidget from '../../system/widgets/grid.client';
import ajax from '../../../modules/ajax/kit.client';
import modalKit from '../../../modules/modal/kit.client';
import escape from 'escape-html';
import gHtml from '../../../modules/gHtml/index.client';
import _ from 'underscore';
import $ from 'jquery';
import {copyEl2Clipboard} from '../../../modules/utils/copy';
import bundles from '../../../modules/utils/bundles.client';

const bulkBtnClasses = 'btn btn-sm btn-purple';
const faPrefix = 'fa fa-';

export default class OrdersGrid extends GridWidget {
	constructor(options) {
		super(options);

		this.$createdFrom = null;
		this.$createdTo = null;
		this.className = 'grid-widget orders-grid-widget';
		this.dateFormat = 'dd.mm.yy';
	}

	initGrid() {
		const locale = this.getClientRegistry().getLocale();

		this.export = ['excel'];
		this.collection = this.url('orders/admin/orders/collection');
		this.idAttribute = 'order_id';
		this.formMode = 'page';

		this.commonFilter =
			{showRmStatus: false};

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Create new order')
				}
			]
		};

		this.bulkButtons = {
			buttons: [
				//@ts-ignore
				// {
				// 	label: this.__('Print'),
				// 	icon: 'fa fa-print',
				// 	class: bulkBtnClasses,
				// 	attrs: {
				// 		'data-action': 'printDialog'
				// 	}
				// },
				//@ts-ignore
				{
					label: this.__('Change status'),
					icon: `${faPrefix}exchange`,
					class: bulkBtnClasses,
					attrs: {
						'data-action': 'statusChange'
					}
				},
				//@ts-ignore
				{
					label: this.__('Delete'),
					icon: `${faPrefix}trash-o`,
					class: bulkBtnClasses,
					attrs: {
						'data-action': 'rmOrders'
					}
				}
			]
		};

		this.wrapperTpl = {
			type: 'widget',
			file: 'ordersGridWrapper',
			package: 'orders'
		};

		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				name: 'status',
				label: this.__('Order'),
				cell: 'html',
				filter: {
					type: 'select',
					options: this.data.options.orderStatus
				},
				html: (column, model, $td) => {
					let confirmation = '';
					if (this.data.needOrderConfirmation) {
						const classes = ['confirmation'];
						if (model.get('is_confirmed') === 1) {
							confirmation = `${gHtml.faIcon('check')} ${this.__('Confirmed')}`;
							classes.push('text-success');
						} else {
							confirmation = `${this.__('Awaiting confirmation')}`;
							classes.push('text-muted');
						}

						confirmation = gHtml.tag('div', {class: classes.join(' ')}, confirmation);
					}

					const out = `
						<p>
							#${model.get('order_id')}
						</p>
						<p class="text-center">
							${model.get('status_title')}
						</p>
						<div class="small">
							${gHtml.faIcon('clock-o')} ${locale.formatDate(model.get('created_at'), 'short')}
							<div class="text-right time">
								${locale.formatTime(model.get('created_at'))}
							</div>
							${confirmation}
						</div>
					`;

					$td.css('background-color', `#${model.get('status_background_color')}`);

					return out;
				}
			},
			{
				name: 'customer',
				label: this.__('Customer'),
				clickable: false,
				cell: 'html',
				html: (column, model) => {
					let out = '';
					if (model.get('customer_id') != null) {
						const user = model.toJSON();
						const name = _.compact(_.values(_.pick(user, ['first_name', 'last_name'])));
						if (name.length > 0) {
							out += gHtml.tag('p', {class: 'name'}, escape(name.join(' ')));
						}

						const contactClasses = 'small text-right contact-wrapper';
						if (user.email) {
							out += gHtml.tag(
								'p',
								{class: contactClasses},
								`${gHtml.link(`${gHtml.faIcon('envelope-o')} ${escape(user.email)}`, `mailto:${escape(user.email)}`)} ${gHtml.link(gHtml.faIcon('copy'), '#', {class: 'addr-copy-icon'})}`
							);
						}

						if (user.phone) {
							out += gHtml.tag(
								'p',
								{class: contactClasses},
								`${gHtml.link(`${gHtml.faIcon('phone')} ${gHtml.tag('span', {class: 'masked-phone'}, escape(user.phone))}`, `tel:${escape(user.phone)}`)} ${gHtml.link(gHtml.faIcon('copy'), '#', {class: 'addr-copy-icon'})}`
							);
						}
					}

					const clientComment = model.get('client_comment');
					const hasAdminComments = model.get('has_admin_comments');

					if (clientComment || hasAdminComments) {
						out += gHtml.tag('div', {class: 'small text-muted'}, `${gHtml.faIcon('comments')} ${this.__('Has comments')}`);
					}

					return out;
				}

			},
			{
				label: this.__('Country'),
				name: 'country_id',
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

					return model.get('country_title');
				}
			},
			{
				label: this.__('Address'),
				name: 'address',
				cell: 'html',
				customClass: 'text-center',
				html: (column, model) => {
					if (!model) {
						return;
					}
					let out = '';
					if (model.get('city')) {
						out = gHtml.tag('p', {class: 'mb-0'}, `${model.get('city')}, ${model.get('state') || ''}`);
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
				name: 'total_price',
				label: this.__('Total'),
				cell: 'html',
				filter: {
					type: 'text',
					attrs: {
						placeholder: this.__('Total (%s)', [locale.getCurrencySymbol()])
					}
				},


				html: (column, model) => {
					let status;
					let out = gHtml.tag('div', {class: 'pull-left'}, model.get('total_price_formatted'));

					const qty = model.get('total_qty');
					if (qty) {
						out += gHtml.tag('div', {class: 'pull-right small'}, `${this.__('Qty:')} ${qty}`);
					}

					out += gHtml.tag('div', {class: 'clearfix'}, '');

					const classes = ['text-end', 'small'];
					if (model.get('is_paid') === 1) {
						classes.push('text-success');
						status = `${gHtml.faIcon('check')} ${this.__('Paid')}`;
					} else {
						classes.push('text-muted');
						status = this.__('Awaiting for payment');
					}

					out += gHtml.tag('div', {class: classes.join(' ')}, status);

					if (model.get('got_cash_at')) {
						out += gHtml.tag('div', {class: 'text-success text-end small'}, `${gHtml.faIcon('smile-o')} ${this.__('Cash is gotten')}`);
					}

					return out;
				}
			}
		];
	}

	events() {
		return Object.assign(super.events(), {
			'click .addr-copy-icon': (e) => {
				e.preventDefault();
				copyEl2Clipboard($(e.currentTarget).prev().get(0));
			},

			'click .filter .toggle-row'(e) {
				e.preventDefault();

				const $second = this.$('.filter .second-row');
				const $filter = this.$('.filter');
				if ($second.is(':visible')) {
					$filter.removeClass('second-opened');
					return $second.slideUp();
				} else {
					$filter.addClass('second-opened');
					return $second.slideDown();
				}
			}
		});
	}

	onBulkActionPrintDialog(models) {
		const orderIDs = (Array.from(models).map((model) => model.get('order_id')));

		return modalKit.createRemote(['orders/admin/print/chooseDocumentList', {orders: orderIDs}]);
	}

	onBulkActionStatusChange(models) {
		const orderIDs = (Array.from(models).map((model) => model.get('order_id')));

		return modalKit.createRemote(['orders/admin/orders/statusChange', {orders: orderIDs}]);
	}

	async onBulkActionCreateParcel(models) {
		const result = await ajax.get(['orders/admin/orders/createParcels'], {id: this.getPkByModels(models)});
		if (result.result) {
			this.refresh();
			this.onBulkActionCancel(models);
		}
	}

	async onBulkActionRmOrders(models) {
		if (!confirm(this.__('Are you sure?'))) {
			return;
		}

		await ajax.post(['orders/admin/orders/rmOrders'], {id: this.getPkByModels(models)});
		this.refresh();
		await this.onBulkActionCancel();
	}

	onBulkActionCashGotten(models, $el) {
		ajax.post(['orders/admin/orders/cashGotten'], {
			id: this.getPkByModels(models),
			val: $el.data('val')
		});
	}

	async runLazyInit() {
		await super.runLazyInit();
		await this.setupCommonForm();
		await bundles.load('clientUI');

		this.listenTo(this.collection, 'backgrid:refresh', () => {
			//@ts-ignore
			this.$('.masked-phone').maskPhone();
		});

		//@ts-ignore
		this.$('.masked-phone').maskPhone();
	}

	setupCommonForm() {
		this.setupDatepicker();

	}

	//		@listenTo @collection, "backgrid:sorted", () =>

	setupDatepicker() {
		this.$createdFrom = this.$('.filter input[name="created_from"]').datepicker({
			dateFormat: this.dateFormat
		})
			.on('change', (e) => {
				this.$createdTo.datepicker('option', 'minDate', this.parseDate(e.currentTarget.value));
			});

		this.$createdTo = this.$('.filter input[name="created_to"]').datepicker({
			dateFormat: this.dateFormat
		})
			.on('change', (e) => {
				this.$createdFrom.datepicker('option', 'maxDate', this.parseDate(e.currentTarget.value));
			});
	}

	prepareBackgridOptions(options) {
		//@ts-ignore
		options.className += ' table-condensed';

		return options;
	}

	remove() {
		this.$createdFrom.remove();
		this.$createdTo.remove();

		return super.remove();
	}


	parseDate(value) {
		let date;
		try {
			date = $.datepicker.parseDate(this.dateFormat, value);
		} catch (error) {
			date = null;
		}

		return date;
	}

	getPkByModels(models) {
		return this.getIdByModels(models, 'order_id');
	}

	getFileName() {
		return __filename;
	}
}