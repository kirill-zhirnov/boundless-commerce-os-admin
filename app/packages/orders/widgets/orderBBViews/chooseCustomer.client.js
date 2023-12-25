import MyBackboneView from '../../../../modules/backbone/my/view.client';
import bs from '../../../../modules/gHtml/bs.client';
import gHtmlActive from '../../../../modules/gHtml/active.client';
import gHtml from '../../../../modules/gHtml/index.client';
import ajax from '../../../../modules/ajax/kit.client';
import escape from 'escape-html';
import {convertResponse} from '../../../system/modules/autocomplete.client';
import bundles from '../../../../modules/utils/bundles.client';
import {clientRegistry} from '../../../../modules/registry/client/client.client';

export default class ChooseCustomer extends MyBackboneView {
	constructor(options) {
		super(...arguments);

		({data: this.data} = options);

		this.oldCustomer = null;
		this.$customerInfo = null;
		this.$chooseCustomer = null;

		this.cityId = null;
		if (this.data.customer && this.data.customer.city_id) {
			this.cityId = this.data.customer.city_id;
		}

		this.$customerSearch = null;

		this.listenTo$(document, 'customerUpdated.customerForm', (e, customer) => {
			return this.setCustomer(customer);
		});
	}

	events() {
		return {
			'click .remove' : e => {
				e.preventDefault();
				return this.setCustomer(null);
			},

			'click .cancel-search': e => {
				e.preventDefault();
				return this.setCustomer(this.oldCustomer);
			}
		};
	}

	render() {
		const i18n = clientRegistry.getI18n();
		const router = clientRegistry.getRouter();

		const infoClasses = ['customer-info'];
		const chooserClasses = ['choose-customer'];
		const customerSearchAttrs = {
			placeholder : i18n.__('Find customer: Name, Phone, Email, etc'),
			class:'customer-search'
		};

		if (this.data.customer || this.data.isLocked) {
			chooserClasses.push('hide');
		} else {
			infoClasses.push('hide');
		}

		this.$el.html(`\
<h5>
	${bs.icon('user')}
	&nbsp;
	${i18n.__('Customer')}
</h5>
${gHtmlActive.hiddenField(this.data.attrs, 'customer_id')}
<div class="${infoClasses.join(' ')}">
	${this.renderCustomerInfo(this.data.customer)}
</div>
<div class="${chooserClasses.join(' ')}">
	<div class="form-group">
		${bs.textField(this.data.attrs, 'customer_search', customerSearchAttrs)}
	</div>
	<div class="form-group clearfix">
		<div class="pull-left">
			<a href="${router.url('customer/admin/customer/form')}" class="create-new" data-modal="">
				${bs.icon('plus')} ${i18n.__('Or create new customer')}
			</a>
		</div>
		<div class="pull-right">
			<a href="#" class="cancel-search hidden">${i18n.__('Cancel')}</a>
		</div>
	</div>
</div>\
`
		);

		bundles.load('clientUI').then(() => {
			this.bindListeners();
			return this.$('a.phone span').maskPhone();
		});

		return this;
	}

	renderCustomerInfo(customer) {
		if (!customer) {
			return '';
		}

		const i18n = clientRegistry.getI18n();
		const router = clientRegistry.getRouter();

		const editUrl = router.url('customer/admin/customer/form', {pk : customer.person_id});
		let info = gHtml.link(`#${customer.person_id}, ${escape(customer.customer_full_name)}`, editUrl, {
			'data-modal': ''
		});

		if (customer.phone || customer.email) {
			info += ',&nbsp;&nbsp;';

			if (customer.phone) {
				info += gHtml.link(`${bs.icon('earphone')} <span>${escape(customer.phone)}</span>`, `callto:${customer.phone}`, {
					class: 'btn btn-default btn-sm phone'
				});
			}

			if (customer.email) {
				info += '&nbsp;' + gHtml.link(`${bs.icon('envelope')} ${escape(customer.email)}`, `mailto:${customer.email}`, {
					class: 'btn btn-default btn-sm'
				});
			}
		}

		info += '<br/>';

		const address = [];
		if (customer.postcode) {
			address.push(customer.postcode);
		}

		if (customer.address) {
			address.push(customer.address);
		}

		if (customer.city_full_name) {
			address.push(customer.city_full_name);
		}

		if (address.length > 0) {
			info += escape(address.join(', '));
		}

		let out = `<p>${info}</p>`;
		if (!this.data.isLocked) {
			out += `\
<p class="text-end">
	<a href="#" class="remove btn btn-default btn-sm">
		${gHtml.faIcon('refresh')}
		${i18n.__('Choose another customer')}
	</a>
</p>\
`;
		}

		return out;
	}

	setCustomer(customer) {
		let id;
		const oldCityId = this.cityId;
		this.oldCustomer = this.data.customer;
		this.data.customer = customer;

		if (customer) {
			id = customer.person_id;
			this.$customerInfo.html(this.renderCustomerInfo(customer)).removeClass('hide');
			this.$chooseCustomer.addClass('hide');
			this.cityId = customer.city_id;
		} else {
			id = '';
			this.$customerInfo.html('').addClass('hide');
			this.$chooseCustomer
				.removeClass('hide')
				.find('.cancel-search').toggleClass('hidden', !this.oldCustomer);


			this.cityId = null;
		}

		this.$('input[name="customer_id"]').val(id);
		this.$('a.phone span').maskPhone();

		if (oldCityId !== this.cityId) {
			return this.trigger('cityChanged', this.cityId);
		}
	}

	bindListeners() {
		this.$customerSearch = this.$('.choose-customer .customer-search');
		this.$customerSearch.autocomplete({
			forceFixPosition: true,
			onSelect: result => {
				this.setCustomer(result.data.customer);
				return this.$customerSearch.val('');
			},

			lookup: (suggestion, callback) => {
				ajax.get(['customer/admin/customer/autocomplete', {q: suggestion}])
				.then(data => {
					callback(convertResponse(suggestion, data));
				});
			},

			minChars: 2
		});

		this.$customerInfo = this.$('.customer-info');
		return this.$chooseCustomer = this.$('.choose-customer');
	}

	isNoCustomer() {
		if (this.$('input[name="customer_id"]').val() === '') {
			return true;
		}

		return false;
	}

	isNoCity() {
		if (this.cityId) { return false; } else { return true; }
	}

	getCityId() {
		return this.cityId;
	}

	remove() {
		if (this.$customerSearch) {
			this.$customerSearch.autocomplete('dispose').remove();

			this.$('a.phone span').unmask();
		}

		super.remove();
	}
}
