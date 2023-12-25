import InstanceS3Storage from '../../../../../modules/s3Storage/instance';
import BasicAdmin from '../../../../system/controllers/admin';

export default class OrderController extends BasicAdmin {
	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/order/checkout');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.setPage({
				title: this.__('Checkout settings')
			});

			this.widget('system.vueApp.@c', {
				data: {
					app: 'orders/checkout/settings',
					props: {
						form: data
					}
				}
			});
		}
	}

	async postActionLogoUpload() {
		const formKit = this.createFormKit('@p-orders/forms/order/checkout/logoUpload', {}, {
			success: (attrs, pk, formKit) => {
				const out =
					{files: formKit.form.getFilesForWeb()};

				this.getAnswer().setPerformWithExpress(false);
				const expressRes = this.getFrontController().getResponse();

				expressRes.json(out);
			}
		});

		await formKit.process();
	}

	async actionRmLogo() {
		const settings = await this.getInstanceRegistry().getSettings().get('orders', 'checkoutPage');
		if (settings?.logo) {
			const s3Storage = new InstanceS3Storage(this.getInstanceRegistry());
			await s3Storage.deleteImgWithThumbs(settings.logo);
		}

		await this.getInstanceRegistry().getSettings().set(
			'orders',
			'checkoutPage',
			Object.assign(settings || {}, {logo: null})
		);

		this.json(true);
	}
}