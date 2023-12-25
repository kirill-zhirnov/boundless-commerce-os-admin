import GridResource from '../../../../modules/controller/resources/grid';
import OrderRemover from '../../modules/orderRemover';
import OrdersCustomerMails from '../../mails/customerMails';
import OrderAdminMails from '../../mails/adminMails';
import OrderWidgetData from '../../components/orderWidgetData';
import InstanceMails from '../../../../modules/instanceManager/mails/instanceMails';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';
import errors from '../../../../modules/errors/errors';
import xlsx from 'xlsx';
import format from 'date-fns/format';

export default class OrdersController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'orders.ordersGrid.@c',
			provider: '@p-orders/dataProvider/admin/orders',
			model: 'orders',
			exporterWidget: '@p-orders/widgets/export/ordersGrid'
		};
	}

	async actionIndex() {
		this.setPage({
			title: this.__('All orders')
		});

		await super.actionIndex();
	}

	async actionForm() {
		const pk = this.getParam('pk');

		if (!pk) {
			await this.createUsersDraft();
			return;
		}

		const group = this.createFormsGroup({
			order: {
				form: '@p-orders/forms/order/order',
				children: {
					qty: '@p-orders/forms/order/orderForm/qty',
					status: '@p-orders/forms/order/orderForm/status',
					customAttrs: '@p-orders/forms/order/orderForm/customAttrs'
				}
			}
		}, {
			skipSetupOnEmpty: ['qty', 'customAttrs'],
			beforeJson: async (result, closeModal, formGroup, forms) => {
				const order = await forms.order.getRecord();
				//@ts-ignore
				await order.reload();

				Object.assign(result.json, {
					//@ts-ignore
					record: order.toJSON(),
					//@ts-ignore
					orderIsLocked: order.isLocked(),
				});
			}
		});

		this.getAnswer().setLayoutData('currentMenuUrl', this.url('orders/admin/orders/index'));
		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();

			Object.assign(data, {
				grid: this.getParam('grid')
			});

			//@ts-ignore
			const title = data.forms.order.record.publishing_status === 'draft'
				? this.__('Create an order')
				//@ts-ignore
				: this.__('Order #%s', [data.forms.order.record.order_id])
			;

			this.setPage('title', title);
			this.setResponseType('layout');
			this.setLayout('admin/orderForm');
			this.setLayoutData('orderData', data);
		}

	}

	async actionStatusChange() {
		const formKit = this.createFormKit('@p-orders/forms/order/bulkStatusChange', {
			//@ts-ignore
			orders: this.getParam('orders', [])
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			this.modal('statusChange', data, this.__('Change status for selected orders (%s)', [data.attrs.orders.length]));
		}
	}

	async postActionRmOrders() {
		let orders = this.getParam('id', []);
		if (!Array.isArray(orders)) {
			orders = [];
		}

		const readyEnv = await this.getEnv();

		const pkList = [];
		for (let orderId of orders) {
			orderId = parseInt(orderId);

			if (!orderId) {
				return;
			}

			const remover = new OrderRemover(readyEnv, orderId);
			await remover.remove();

			pkList.push(orderId);
		}

		await this.getInstanceRegistry().getEventPublisher().modelRemoved({
			model: 'orders',
			pkList
		});

		this.alertSuccess(this.__('Selected items were successfully removed.'));
		this.json({});
	}

	async createUsersDraft() {
		//@ts-ignore
		const pk = await this.getModel('orders').createUsersDraft(this.getUser().getId());
		const params = {pk};

		const grid = this.getParam('grid');
		if (grid) {
			params.grid = grid;
		}

		this.redirect(['orders/admin/orders/form', params]);
	}

	async actionExport() {
		const dataProvider = await this.createDataProvider('@p-orders/dataProvider/admin/orders', {}, this.getParam('grid'));
		dataProvider.setAddOrdersItemsToQuery(true);
		dataProvider.turnOffPagination();

		try {
			await dataProvider.validate();
			const sql = await dataProvider.createSql();
			const rows = await dataProvider.makeSqlRequest(sql);
			await this.exportOrdersToXLS(rows);
			// console.log('rows:', rows);
			// const data = await this.prepareData(rows);

			// return data;
		} catch (e) {
			if (e instanceof Error) {
				throw e;
			}

			if (wrapperRegistry.isDebug()) {
				console.error('\n\nData provider validation errors:', this.getErrors());
			}

			throw new errors.HttpError(400, 'Incorrect input params');
		}
		this.html('soon');
	}

	async exportOrdersToXLS(rows) {
		const data = [
			['ID', 'Status', 'Date', 'Total', 'Total Qty', 'Is Paid?', 'Customer Name', 'Customer Email', 'Customer Phone', 'Country (Shipping)', 'Address (Shipping)', 'Item', 'SKU', 'Item Qty', 'Item Price', 'Item Sub-Total']
		];

		for (const row of rows) {
			const name = [];
			if (row.first_name) {
				name.push(row.first_name);
			}
			if (row.last_name) {
				name.push(row.last_name);
			}

			const address = [];
			if (row.shipping_zip) {
				address.push(row.shipping_zip);
			}
			if (row.shipping_address_line_1) {
				address.push(row.shipping_address_line_1);
			}
			if (row.shipping_address_line_2) {
				address.push(row.shipping_address_line_2);
			}
			if (row.shipping_city) {
				address.push(row.shipping_city);
			}
			if (row.shipping_state) {
				address.push(row.shipping_state);
			}

			let dataRow = [
				row.order_id, row.status_title, row.created_at, row.total_price, row.total_qty, row.is_paid ? 'yes' : 'no',
				name.join(' '), row.email, row.phone, row.shipping_country_title, address.join(', ')
			];

			const basicColumnsAmount = dataRow.length;
			if (Array.isArray(row.items)) {
				for (const [itemKey, val] of Object.entries(row.items)) {
					const subCols = this.makeItemXLSCols(val);

					if (itemKey == 0) {
						dataRow = dataRow.concat(subCols);
						data.push(dataRow);
					} else {
						const emptyRow = Array(basicColumnsAmount);
						data.push(emptyRow.concat(subCols));
					}
				}

			} else {
				data.push(dataRow);
			}
		}

		// console.log(data);
		// return;
		this.getAnswer().setPerformWithExpress(false);
		const expressRes = this.getFrontController().getResponse();

		expressRes.set({
			'Content-Type': 'application/vnd.ms-excel',
			'Content-Disposition': `attachment;filename="order_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx"`
		});
		const wbOut = xlsx.write({
			SheetNames: ['export'],
			Sheets: {
				'export': xlsx.utils.aoa_to_sheet(data)
			}
		}, {
			bookType: 'xlsx',
			type: 'buffer'
		});
		expressRes.send(wbOut);
	}

	makeItemXLSCols(item) {
		const title = [];
		let sku = '';

		if (item.type == 'product') {
			title.push(item.product.title);
			sku = item.product.sku;
		} else if (item.type == 'variant') {
			title.push(item.product.title);
			title.push(item.variant.title);
			sku = item.variant.sku;
		} else {
			if (item.custom_item.title) {
				title.push(item.custom_item.title);
			}
		}

		return [
			title.join(' '),
			sku,
			item.qty,
			item.final_price,
			item.total_price
		];
	}

	/*
	async actionTestRender() {
		return;
		const instanceInfo = (await wrapperRegistry.getDb().model('instance').findOne({
			where: {
				instance_id: 1
			}
		})).toJSON();

		// const orderId = 463;

		const mail = new InstanceMails();
		await mail.sendInstanceCreated('ekvixgroup@gmail.com', {
			userPass: '123',
			authUrlAdmin: 'http://custom.node/admin/',
			baseUrl: 'http://custom.node'
		}, instanceInfo);

		this.getAnswer().setPerformWithExpress(false);
		// this.getFrontController().getResponse().send(html.full);
		this.getFrontController().getResponse().send('sent');

		// const mail = new OrderAdminMails(this.getInstanceRegistry());
		//
		// const orderData = new OrderWidgetData(this.getInstanceRegistry(), this.getClientRegistry(), orderId);
		// const data = await orderData.getOrderData();
		//
		// const {full} = await mail.renderNewOrderContent(data);
		//
		// this.getAnswer().setPerformWithExpress(false);
		// this.getFrontController().getResponse().send(full);
		// const order = await this.getModel('orders').findOne({where: {order_id: orderId}});
		//
		// const mail = new OrdersCustomerMails(this.getInstanceRegistry());
		// const template = await mail.getNotificationTemplate('created');
		// const {subject, html} = await mail.renderSubjectAndBody(order, template);
		//
		// this.getAnswer().setPerformWithExpress(false);
		// this.getFrontController().getResponse().send(html.full);
	}
	*/
}
