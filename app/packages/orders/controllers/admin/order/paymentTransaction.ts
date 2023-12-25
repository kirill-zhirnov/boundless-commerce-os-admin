import BasicAdmin from '../../../../system/controllers/admin';

export default class PaymentTransactionController extends BasicAdmin {
	async actionCollection() {
		const dataProvider = await this.createDataProvider('@p-orders/dataProvider/admin/orderTransactions');
		const data = await dataProvider.getData();

		this.json(data);
	}
}