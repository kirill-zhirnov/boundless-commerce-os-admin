import BasicAdmin from '../../../../../system/controllers/admin';

export default class MultiController extends BasicAdmin {
	async actionSetPrice() {
		const formKit = this.createFormKit('@p-catalog/forms/product/stockAndPrice/variants/setPrices', {}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		const data = await formKit.getWebForm();
		//@ts-ignore
		this.modal('setPrice', {data}, this.__('Set prices for variants (%s)', [formKit.form.getVariants().length]), null, {
			setSize: 'small'
		});
	}

	async actionSetQty() {
		const formKit = this.createFormKit('@p-catalog/forms/product/stockAndPrice/variants/setQty', {}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		const data = await formKit.getWebForm();
		//@ts-ignore
		this.modal('setQty', {data}, this.__('Set stock for variants (%s)', [formKit.form.getVariants().length]), null, {
			setSize: 'small'
		});
	}
}