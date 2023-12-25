import FormWidget from '../../../modules/widget/form.client';
import bundles from '../../../modules/utils/bundles.client';
import _ from 'underscore';

export default class CustomerAddressForm extends FormWidget {
	attributes() {
		return _.extend(super.attributes(), {
			action: this.url('customer/admin/address/form', {person: this.data.personId}),
			class: 'customer-address-form'
		});
	}

	run() {
		return this.render('addressForm');
	}

	runLazyInit() {
		bundles.load('clientUI').then(() => {
			this.$('input[name="phone"]').maskPhone();

			return this.loaded = true;
		});
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