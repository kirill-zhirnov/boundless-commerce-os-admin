import GridResource from '../../../../../modules/controller/resources/grid';

export default class OrderStatus extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'orders.orderStatusGrid.@c',
			provider: '@p-orders/dataProvider/admin/orderStatus',
			model: 'order_status'
		};
	}


	async actionIndex() {
		this.setPage('title', this.__('Order Statuses'));

		await super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/orderStatus', {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			const title = (data.scenario === 'update')
				? this.__('Edit order status')
				: this.__('Create new order status')
				;
			this.modal('form', {data}, title);
		}
	}

	async actionBulkRm() {
		const ids = this.getParam('id');
		if (!Array.isArray(ids) || !ids.length) return;

		await this.getDb().sql(`
			update
				order_status
			set
				deleted_at = now()
			where
				status_id in (:ids)
		`, {
			ids
		});

		this.json({});
	}

	async actionBulkRestore() {
		const ids = this.getParam('id');
		if (!Array.isArray(ids) || !ids.length) return;

		await this.getDb().sql(`
			update
				order_status
			set
				deleted_at = null
			where
				status_id in (:ids)
		`, {
			ids
		});

		this.json({});
	}
}