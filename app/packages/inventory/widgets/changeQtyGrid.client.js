import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';
import bs from '../../../modules/gHtml/bs.client';
import gHtmlActive from '../../../modules/gHtml/active.client';

const labelSuccess = 'label-success';
const labelWarning = 'label-warning';
const labelInfo = 'label-info';
const labelDefault = 'label-default';

export default class ChangeQtyGrid extends GridWidget {
	constructor(options) {
		super(options);

		this.$ts = null;
		this.className = 'grid-widget change-qty-history-grid';
	}

	initGrid() {
		this.collection = this.url('inventory/admin/history/changeQty/collection');

		this.export = ['excel'];

		this.wrapperTpl = {
			type: 'widget',
			file: 'changeQtyGridWrapper',
			package: 'inventory'
		};

		this.idAttribute = 'movement_item_id';
		this.columns = [
			{
				name: 'item',
				label: this.__('Item'),
				cell: 'html',
				html: (column, model) => {
					const classes = [];
					let img = '';
					if (model.get('thumb200')) {
						classes.push('with-img');
						img = gHtml.img(model.get('thumb200'), true);
					}

					let sku = '';
					if (model.get('sku')) {
						sku = gHtml.tag('p', {class: 'small text-muted'}, `${this.__('SKU')}: ${model.get('sku')}`);
					}

					const link = gHtml.link(`#${model.get('product_id')}`, this.url('catalog/admin/product/form', {
						pk: model.get('product_id')
					}), {
						'data-skip-grid-action': '1'
					});

					const textWrapper = gHtml.tag(
						'div',
						{class: 'text-wrapper'},
						gHtml.tag('p', {class: 'small'}, model.get('title')) +
						gHtml.tag('p', {class: 'small text-muted'}, `${this.__('ID')}: ${link}`) +
						sku
					);

					return gHtml.tag(
						'div',
						{class: classes.join(' ')},
						`${img} ${textWrapper}`
					);
				}
			},
			{
				name: 'action',
				label: this.__('Action'),
				cell: 'html',
				sortable: false,
				filter: () => {
					const orderAttrs = {
						placeholder: this.__('Order ID'),
						class: 'form-control-sm'
					};

					const actionAttrs = {
						class: 'form-select-sm'
					};

					return `
						<div class="d-flex gap-2 justify-content-center">
							${bs.dropDownList(this.data.attrs, 'action', this.data.options.action, null, actionAttrs)}
							${bs.textField(this.data.attrs, 'order_id', orderAttrs)}
						</div>
					`;
				},
				html: (column, model) => {
					const action = model.get('action');
					const actionTitle = gHtmlActive.value(model.attributes, 'action', this.data.options.action);

					let out = gHtml.tag('p', {class: 'text-center'}, actionTitle);

					out += gHtml.tag('p', {class: 'small'}, `${this.__('Reason:')} ${model.get('reason_title')}`);
					out += this.getActionOrderSuffix(model);

					if (action === 'warehouseMovement') {
						let transferLink = '';
						const completedTransferId = model.get('completed_transfer_id');
						const cancelledTransferId = model.get('cancelled_transfer_id');

						const transferRoute = 'inventory/admin/warehouseMovements/form';
						if (completedTransferId) {
							transferLink = gHtml.link(this.__('Transfer #%s', [completedTransferId]), this.url(transferRoute, {pk: completedTransferId}));
						} else if (cancelledTransferId) {
							transferLink = gHtml.link(this.__('Transfer cancellation #%s', [cancelledTransferId]), this.url(transferRoute, {pk: cancelledTransferId}));
						}

						out += gHtml.tag('p', {class: 'small text-muted'}, `${model.get('from_warehouse_title')} ${gHtml.faIcon('arrow-right')} ${model.get('to_warehouse_title')}`);
						if (transferLink) {
							out += gHtml.tag('div', {class: 'small text-center'}, transferLink);
						}
					}

					return out;
				}
			},
			{
				name: 'location',
				label: this.__('Qty difference'),
				sortable: false,
				cell: 'html',
				html: (column, model) => {
					const groupedAction = model.get('groupedAction');
					let availableQty = model.get('available_qty_diff');
					let reservedQty = model.get('reserved_qty_diff');
					let movedQty = null;
					let availableQtyClass = null;
					let reservedQtyClass = null;
					const warehouse = model.get('from_warehouse_title') || model.get('to_warehouse_title');
					let action = null;

					if (groupedAction) {
						action = this.getQtyAction(groupedAction);

						switch (groupedAction) {
							case 'transfer':
								availableQtyClass = labelInfo;
								movedQty = availableQty;
								availableQty = null;
								break;

							case 'reserve':
								availableQtyClass = labelDefault;
								reservedQtyClass = labelDefault;
								break;
						}
					}

					let out = '';
					if (action) {
						out += gHtml.tag('p', {class: `small text-center ${action.class}`}, action.text);
					}

					if (movedQty) {
						out += gHtml.tag(
							'p',
							{class: 'text-center'},
							gHtml.tag('span', {class: 'small'}, this.__('Moved qty:')) + ' ' +
							gHtml.tag('span', {class: `label ${availableQtyClass}`}, movedQty)
						);
					}

					if (availableQty) {
						availableQty = availableQty > 0 ? `+${availableQty}` : availableQty;

						if (!availableQtyClass) {
							availableQtyClass = availableQty > 0 ? labelSuccess : labelWarning;
						}

						out += gHtml.tag(
							'p',
							{class: 'text-center'},
							gHtml.tag('span', {class: 'small'}, this.__('Available qty:')) + ' ' +
							gHtml.tag('span', {class: `label ${availableQtyClass}`}, availableQty)
						);
					}

					if (reservedQty) {
						reservedQty = reservedQty > 0 ? `+${reservedQty}` : reservedQty;

						if (!reservedQtyClass) {
							reservedQtyClass = reservedQty > 0 ? labelSuccess : labelWarning;
						}

						out += gHtml.tag(
							'p',
							{class: 'text-center'},
							gHtml.tag('span', {class: 'small'}, this.__('Reserved qty:')) + ' ' +
							gHtml.tag('span', {class: `label ${reservedQtyClass}`}, reservedQty)
						);
					}

					if (warehouse) {
						out += gHtml.tag('p', {class: 'small text-muted'}, `${this.__('Warehouse:')} ${warehouse}`);
					}

					return out;
				},

				filter: {
					type: 'select',
					options: this.data.options.location
				}
			},
			{
				name: 'ts',
				label: this.__('Date'),
				cell: 'html',
				filter: {
					type: 'text',
					attrs: {
						placeholder: this.__('DD.MM.YYYY')
					}
				},
				html: (column, model) => {
					let userTpl = '';
					if (model.get('person_id')) {
						let id, role;
						if (model.get('is_admin')) {
							role = this.__('Administrator');
							id = `#${model.get('person_id')}`;
						} else {
							role = this.__('Customer');
							id = gHtml.link('#' + model.get('person_id'), this.url('customer/admin/customer/form', {pk: model.get('person_id')}), {
								'data-modal': 1
							});
						}

						userTpl = gHtml.tag('p', {class: 'small'}, `${gHtml.faIcon('user')} ${model.get('person')}`);
						userTpl += gHtml.tag('p', {class: 'small text-end text-muted'}, `${role} (${id})`);
					}

					userTpl += ` ${gHtml.tag('p', {class: 'small text-end'}, `${model.get('date')}, ${model.get('time')}`)}`;

					return userTpl;
				}
			}
		];

		this.commonButtons = null;
		this.commonFilter.showRmStatus = false;
	}

	getActionOrderSuffix(model) {
		const orderId = model.get('order_id');
		if (!orderId) {
			return '';
		}

		const linkAttrs =
			{'data-skip-grid-action': '1'};

		const orderLink = gHtml.link(`#${orderId}`, this.url('orders/admin/orders/form', {
			pk: orderId
		}), linkAttrs);

		let addition = `${this.__('Order')} ${orderLink}.`;

		const props = model.get('movement_props');
		if (props && props.orderStatusTo && props.orderStatusFrom) {
			addition += `&nbsp;${this.__('Status was changed from "%s" to "%s"', [this.data.orderStatus[props.orderStatusFrom], this.data.orderStatus[props.orderStatusTo]])}`;
		}

		return gHtml.tag('p', {class: 'small'}, addition);
	}

	createHtmlView() {
		super.createHtmlView();
		this.setupDatepicker();
	}

	setupDatepicker() {
		//@ts-ignore
		this.$ts = this.$('.column-ts input').datepicker({
			dateFormat: 'dd.mm.yy'
		});
	}

	getQtyAction(type) {
		const out = {
			text: null,
			class: null
		};

		switch (type) {
			case 'income':
				out.text = this.__('Income');
				out.class = 'text-success';
				break;

			case 'write_off':
				out.text = this.__('Write-off');
				out.class = 'text-warning';
				break;

			case 'reserve':
				out.text = this.__('Operation with a reserve');
				out.class = 'text-muted';
				break;

			case 'transfer':
				out.text = this.__('Transfer');
				out.class = 'text-muted';
				break;
		}

		return out;
	}

	remove() {
		if (this.$ts) {
			this.$ts.remove();
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}