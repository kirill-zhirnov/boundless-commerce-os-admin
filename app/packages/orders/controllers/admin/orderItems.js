import BasicAdmin from '../../../system/controllers/admin';

export default class OrderItemsController extends BasicAdmin {
	async actionAutocomplete() {
		const dataProvider = await this.createDataProvider('@p-orders/dataProvider/admin/productAutocomplete');
		const result = await dataProvider.getData();
		this.json(result);
	}

	async actionCollection() {
		const form = this.createForm('@p-orders/forms/order/items', {
			pk: this.getParam('orderId')
		});

		await form.setup();
		//@ts-ignore
		const items = form.getItems();
		//@ts-ignore
		const total = form.getTotal();

		this.json([
			{
				order: 'asc',
				sortBy: 'created_at',
				page: 1,
				perPage: false,
				totalEntries: items.length,
				totalPrice: total.price,
				totalQty: total.qty
			},
			items
		]);
	}

	async actionBulkRm() {
		const form = this.createForm('@p-orders/forms/order/items', {
			pk: this.getParam('orderId')
		});

		await form.setup();
		//@ts-ignore
		await form.removeItems(this.getParam('item', []));
		return this.json({});
	}
}