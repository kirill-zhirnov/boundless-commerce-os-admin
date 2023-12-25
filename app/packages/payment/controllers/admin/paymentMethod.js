import GridResource from '../../../../modules/controller/resources/grid';

export default class PaymentMethodController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'payment.adminGrid.@c',
			provider: '@p-payment/dataProvider/admin/paymentMethod',
			form: '',
			model: 'paymentMethod'
		});
	}

	async actionIndex() {
		this.setPage({
			title: this.__('Payment methods')
		});

		await super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-payment/forms/admin/paymentMethods/basicPaymentMethod');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			this.modal('form', {data}, this.__('Edit "%s"', [data.attrs.title]), null, {
				setSize: 'large'
			});
		}
	}

	async actionAddForm() {
		const formKit = this.createFormKit('@p-payment/forms/admin/paymentMethods/createPaymentMethod', {}, {
			success : (attrs, pk, formKit) => {
				//@ts-ignore
				const route = this.getModel('paymentGateway').getRouteFormByAlias(formKit.form.getAddedGateway().alias);

				return this.modalRedirect(this.url(route, {pk}));
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.modal('addForm', {data}, this.__('Select payment gateway:'));
		}
	}

	async actionPaypal() {
		const formKit = this.createFormKit('@p-payment/forms/admin/paymentMethods/paypal');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			Object.assign(data, {
				isWixInstance: Boolean(this.getInstanceRegistry().getInstanceInfo().wix_instance_id),
				wixUrls: {
					returnUrl: this.url('payment/paypal/return', {}, true),
					cancelUrl: this.url('payment/paypal/cancel', {}, true)
				}
			});

			//@ts-ignore
			this.modal('paypal', {data}, this.__('Edit "%s"', [data.attrs.title]), null, {
				setSize: 'large'
			});
		}
	}
}
