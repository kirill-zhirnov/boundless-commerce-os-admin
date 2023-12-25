import BasicController from '../../../modules/controller/basic';
import {makeBoundlessSystemApi} from '../../auth/modules/boundlessApiBaker';
import FrontEndUrls from '../../../modules/url/frontendUrls';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

export default class PaypalController extends BasicController{
	async actionReturn() {
		await this.processPaypalPayment(false);
	}

	async actionCancel() {
		await this.processPaypalPayment(true);
	}

	async processPaypalPayment(isCancel: boolean) {
		let redirectError: string|null = null;
		const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());

		try {
			const apiClient = await makeBoundlessSystemApi(this.getInstanceRegistry());
			const {result, order} = await apiClient.checkout.paypalCapture(this.getParam('token', ''));

			if (order) {
				let state;
				if (!isCancel) {
					state = result ? 'payment-success' : 'payment-error';
				} else {
					state = 'payment-cancelled';
				}

				const redirectUrl = await frontendUrls.getOrderUrlByOrderId(order.id, state);
				this.redirect(redirectUrl);
				return;
			} else {
				redirectError = 'Cant process payment';
			}
		} catch (e) {
			if (wrapperRegistry.isDebug()) {
				console.error('caught paypal return err:', e);
			}
		}

		const router = this.getInstanceRegistry().getRouter();
		const siteUrl = await frontendUrls.getSiteUrl();
		const params = {};
		if (redirectError) {
			Object.assign(params, {error: redirectError});
		}

		this.redirect(`${siteUrl}?${router.createGetStr({error: redirectError})}`);
	}
}