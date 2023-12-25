import BasicAdmin from '../../../../system/controllers/admin';

export default class DiscountController extends BasicAdmin {
	async actionIndex() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/discounts');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.setPage({
				title: this.__('Shipping discounts')
			});

			data.buttons = {
				buttons: ['save'],
				predefinedButtons: {
					save: {
						title: this.__('Save')
					}
				}
			};

			return this.render('index', data);
		}
	}
}