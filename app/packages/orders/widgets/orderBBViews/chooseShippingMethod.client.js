import MyBackboneView from '../../../../modules/backbone/my/view.client';
import bs from '../../../../modules/gHtml/bs.client';
import gHtml from '../../../../modules/gHtml/index.client';
import gHtmlActive from '../../../../modules/gHtml/active.client';
import modalKit from '../../../../modules/modal/kit.client';
import $ from 'jquery';
import _ from 'underscore';
import {clientRegistry} from '../../../../modules/registry/client/client.client';

export default class ChooseShippingMethod extends MyBackboneView {
	constructor(options) {
		super(options);

		({data: this.data, customerView: this.customerView} = options);

		if (this.data.delivery) {
			this.delivery = this.data.delivery;
		}

		this.editingDeliveryId = null;
		this.listenTo(this.customerView, 'cityChanged', () => this.render());

		const Collection = MyBackboneView.extend({
			url : () => {
				return this.getRatesUrl();
			}
		});
		this.collection = new Collection();
		this.listenTo(this.collection, 'sync', () => this.renderRates());
		this.listenTo(this.collection, 'change:point', () => this.renderRates());

		this.listenTo$('body', 'pickupPointSelected.form', (e, data) => {
			const model = this.collection.findWhere({id : this.editingDeliveryId});
			if (model) {
				model.set('point', data);

				return this.$('.rates tr[data-delivery-id="' + this.editingDeliveryId + '"] .use-it').trigger('click');
			}
		});
	}

	events() {
		return {
			'click .use-it' : 'onUseDeliveryMethodClicked',
			'click .change-shipping-method' : 'onChangeShippingMethodClicked',
			'change input[name=\'delivery_price\']' : 'onDeliveryPriceChanged',
			'keyup input[name=\'delivery_price\']' : 'onDeliveryPriceChanged',
			'click .choose-pickup-point' : 'onChoosePickupPointClicked'
		};
	}

	render() {
		const i18n = clientRegistry.getI18n();
		if (this.customerView.isNoCustomer()) {
			this.$el.html(bs.alert('warning', i18n.__('Please select customer, to be able specify shipping address')));
		} else if (this.customerView.isNoCity()) {
			this.$el.html(bs.alert('warning', i18n.__('Please select city in customer address.')));
		} else {
			this.$el.html(`\
<div class="info-wrapper"></div>
<div class="rates-wrapper"></div>\
`
			);

			let deliveryOption = null;

			if (this.delivery) {
				deliveryOption = _.findWhere(this.data.options.shippingType, {0:parseInt(this.delivery.delivery_id)});
			}

			if (this.delivery && !deliveryOption) {
				this.renderDeliveryInfo();
			} else {
				this.renderDeliveryRates();
			}
		}

		return this;
	}

	renderDeliveryRates() {
		const i18n = clientRegistry.getI18n();
		this.$el.find('.rates-wrapper').html(`\
<table class="rates table table-striped">
	<thead>
		<tr>
			<th>${i18n.__('Shipping method')}</th>
			<th>${i18n.__('Price')}</th>
			<th>${i18n.__('Delivery time')}</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		<tr class="loading">
			<td colspan="4">${i18n.__('Loading shipping rates...')}</td>
		</tr>
	</tbody>
</table>\
`
		);

		return this.collection.fetch({reset: true});
	}

	renderDeliveryInfo() {
		const i18n = clientRegistry.getI18n();

		let changeMethodBtn;
		const priceProps =
			{class : 'form-control-sm'};

		if (this.data.isLocked) {
			changeMethodBtn = '';
			priceProps.disabled = 'disabled';
		} else {
			changeMethodBtn = `\
<a href="#" class="change-shipping-method btn btn-default btn-sm">
	${bs.icon('refresh')}
	${i18n.__('Change shipping method')}
</a>\
`;
		}

		let pickupPoint = '';
		if (this.delivery && (this.delivery.sub_type === 'pickupPoint') && this.delivery.point) {
			pickupPoint = `\
<br>
<span class="small">
	${i18n.__('Pickup point address:')} ${this.delivery.point.address}
</span>
${gHtml.hiddenField('point_id', this.delivery.point.id)}\
`;
		}

		let deliveryTariffName = '';

		if (this.delivery && this.delivery.delivery_data) {
			if (this.delivery.delivery_data.name && (this.delivery.title.indexOf(this.delivery.delivery_data.name) === -1)) {
				deliveryTariffName = `(${this.delivery.delivery_data.name})`;
			}

			if (this.delivery.delivery_data.id) {
				const strah = this.delivery.delivery_data.strah === '1' ? '.i' : '';
				this.delivery.delivery_id = `${parseInt(this.delivery.delivery_id)}.${this.delivery.delivery_data.id}${strah}`;
			}
		}

		return this.$el.find('.info-wrapper').html(`\
${gHtmlActive.hiddenField(this.delivery, 'delivery_id')}
<div class="form-inline">
	<div class="form-group">
		<p class="form-control-static">${this.delivery.title} ${deliveryTariffName} ${pickupPoint}</p>
	</div>
	<div class="form-group group-delivery-price">
		<div class="input-group">
			${bs.textField(this.delivery, 'delivery_price', priceProps)}
			<div class="input-group-text">${locale.getCurrencySymbol()}</div>
		</div>
	</div>
	${changeMethodBtn}
</div>\
`
		);
	}

	renderRates() {
		const i18n = clientRegistry.getI18n();
		const router = clientRegistry.getRouter();
		const $rates = this.$('.rates');
		const $tbody = $rates.find('tbody');
		$tbody.empty();

		if (this.collection.length > 0) {
			return this.collection.each(model => {
				let pickupPointRow = '';

				if (model.get('sub_type') === 'pickupPoint') {
					pickupPointRow = '';

					if (model.get('point')) {
						pickupPointRow += `\
<p class="small">
	${i18n.__('Pickup point address:')} ${model.get('point').address}
</p>\
`;
					}
					pickupPointRow += `\
<div>
	<a href="#" class="small choose-pickup-point">${i18n.__('choose pickup point')}</a>
</div>\
`;
				}

				return $tbody.append(`\
<tr data-delivery-id="${model.get('id')}">
	<td class="title">
		<p>${model.get('title')}</p>
		${pickupPointRow}
	</td>
	<td class="rate">
		<div class="form-group">
			${bs.textField(model.toJSON(), 'rate')}
		</div>
	</td>
	<td class="delivery-time small">${(model.get('delivery_time') != null) ? model.get('delivery_time') : ''}</td>
	<td>
		<a href="#" class="btn btn-default btn-sm use-it">
			${bs.icon('ok')}
			${i18n.__('Use it')}
		</a>
	</td>
</tr>\
`
				);
			});
		} else {
			let warningText = i18n.__('There are no available shipping methods. Please');
			warningText += `\
&nbsp;
<a href="${router.url('orders/admin/setup/delivery/settings')}" class="btn btn-default btn-sm">
	${bs.icon('wrench')}
	${i18n.__('configure it')}
</a>\
`;

			return $tbody.append(`\
<tr>
	<td colspan="4">
		${bs.alert('warning', warningText)}
	</td>
</tr>\
`
			);
		}
	}

	onChoosePickupPointClicked(e) {
		e.preventDefault();

		this.editingDeliveryId = $(e.currentTarget).parents('tr:eq(0)').data('delivery-id');

		const params = {
			delivery : this.editingDeliveryId,
			city : this.customerView.getCityId()
		};

		const paymentMethod = $('#payment_method_id');
		if (paymentMethod.length > 0) {
			params.paymentMethod = paymentMethod.val();
		}

		return modalKit.createRemote(['orders/admin/shipping/pickupPoint', params]);
	}

	onUseDeliveryMethodClicked(e) {
		e.preventDefault();

		const $tr = $(e.currentTarget).parents('tr:eq(0)');

		const model = this.collection.findWhere({id : String( $tr.data('delivery-id') )});

		if ((model.get('sub_type') === 'pickupPoint') && !model.get('point')) {
			$tr.find('.choose-pickup-point').trigger('click');
			return;
		}

		this.delivery = {
			delivery_id : model.get('id'),
			delivery_price : $tr.find('input[name="rate"]').val(),
			title : model.get('title'),
			sub_type : model.get('sub_type'),
			delivery_data : model.get('delivery_data')
		};

		if (model.get('point')) {
			this.delivery.point = model.get('point');
		}

		this.render();
		return this.onDeliveryPriceChanged();
	}

	onChangeShippingMethodClicked(e) {
		e.preventDefault();

		return this.renderDeliveryRates();
	}

	getDeliveryPrice() {
		return this.$('input[name="delivery_price"]').val();
	}

	onDeliveryPriceChanged() {
		return this.trigger('deliveryPriceChanged');
	}

	getRatesUrl() {
		const params =
			{city_id : this.customerView.getCityId()};

		const paymentMethod = $('#payment_method_id');
		if (paymentMethod.length > 0) {
			params.paymentMethod = paymentMethod.val();
		}

		if (this.data.pk) {
			params.orderId = this.data.pk;
		}

		if (this.delivery) {
			params.delivery = this.delivery.delivery_id;

			if (this.delivery.point) {
				params.point = this.delivery.point.id;
			}
		}

		return clientRegistry.getRouter().url('orders/admin/shipping/getRates', params);
	}

	remove() {
		this.data = null;
		this.customerView = null;

		return super.remove();
	}
}
