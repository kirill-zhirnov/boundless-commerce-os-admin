import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';

export default class CouponForm extends FormWidget {
	attributes() {
		return _.extend(super.attributes(), {
			action: this.url('orders/admin/discount/codes/form')
		});
	}

	run() {
		return this.render('couponForm');
	}

	runLazyInit() {
		const Vue = require('vue').default;
		const VueCouponForm = require('./couponForm/Form.vue').default;

		this.vues.push(
			new Vue({
				render: (h) => {
					return h(VueCouponForm, {
						props: this.data
					});
				}
			}).$mount(this.$('.vue-root').get(0))
		);
	}

	getFileName() {
		return __filename;
	}
}