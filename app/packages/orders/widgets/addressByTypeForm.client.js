import FormWidget from '../../../modules/widget/form.client';
import bundles from '../../../modules/utils/bundles.client';

export default class AddressByTypeForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('orders/admin/order/customer/addressByType',
				{
					order: this.data.orderId,
					type: this.data.addressType
				}),
			class: 'customer-address-form'
		});
	}

	run() {
		return this.render('addressByTypeForm');
	}

	async runLazyInit() {
		await super.runLazyInit();
		await bundles.load('clientUI');
		this.$('input[name="phone"]').maskPhone();
		this.loaded = true;
	}

	remove() {
		if (this.loaded) {
			this.$('input[name="phone"]').unmask();
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}