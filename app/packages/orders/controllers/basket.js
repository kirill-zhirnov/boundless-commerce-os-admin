import BasicController from '../../../modules/controller/basic';
// import toBasketAction from '../actions/toBasket';

export default class BasketController extends BasicController {
	// actionIndex() {
	// 	const formKit = this.createFormKit('@p-orders/forms/basket', {}, {
	// 		successMsg : false,
	// 		successRedirect : this.url('orders/checkout/shipping')
	// 	});
	//
	// 	if (this.isSubmitted()) {
	// 		return formKit.process();
	// 	} else {
	// 		return formKit.getWebForm()
	// 		.then(data => {
	// 			this.setPage('title', this.getI18n().__('Basket'));
	//
	// 			this.setPage('robots', 'noindex');
	// 			return this.widget('orders.basketForm.@c', {
	// 				data
	// 			});
	// 	});
	// 	}
	// }

	async actionSummary() {
		const data = await this.getClientRegistry().getBasket().calcSummary();

		this.json(data);
	}

	// actionAdd() {
	// 	return toBasketAction.run.call(this);
	// }
	//
	// actionRm() {
	// 	return this.getClientRegistry().getBasket().remove(this.getParam('id'))
	// 	.then(() => {
	// 		return this.json({});
	// })
	// 	.done();
	// }
	//
	// actionChooseVariant() {
	// 	const formKit = this.createFormKit('@p-catalog/forms/product/frontendBasket', {
	// 		qty: this.getParam('qty'),
	// 		callToOrder: this.getParam('callToOrder')
	// 	});
	//
	// 	return formKit.getWebForm()
	// 	.then(widgetData => {
	// 		return this.modal('chooseVariant', {widgetData}, this.getI18n().__('Add to basket "%s"', [widgetData.product.title]), null, {
	// 			setSize : 'small'
	// 		});
	// });
	// }
}
