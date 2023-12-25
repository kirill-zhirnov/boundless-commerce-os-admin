import FormWidget from '../../../modules/widget/form.client';
import $ from 'jquery';
import adminBasket from '../../orders/modules/adminBasket.client';

export default class ToBasketVariants extends FormWidget {
	attributes() {
		const actionParams = {};
		if (this.data.orderId) {
			actionParams.orderId = this.data.orderId;
		}

		return {
			action: this.url('catalog/admin/product/toBasketVariants', actionParams),
			class : 'to-basket-variants'
		};
	}

	run() {
		return this.render('toBasketVariants', this.data);
	}

	events() {
		const events = super.events();

		events['click .list-group-item'] = 'onListItemClicked';

		return events;
	}

	processSuccessResult() {
		super.processSuccessResult(...arguments);

		adminBasket.triggerRefreshed();
	}

	getFileName() {
		return __filename;
	}

	onListItemClicked(e) {
		const target = $(e.target);
		if (target.prop('tagName').toLowerCase() !== 'input') {
			return target.find('input').trigger('click');
		}
	}
}