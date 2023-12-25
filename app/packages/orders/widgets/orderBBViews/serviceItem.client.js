import bs from '../../../../modules/gHtml/bs.client';
import moolah from 'moolah';
import MyBackboneView from '../../../../modules/backbone/my/view.client';
import {clientRegistry} from '../../../../modules/registry/client/client.client';
import $ from 'jquery';

export default class ServiceItem extends MyBackboneView {
	constructor(options) {
		Object.assign(options, {
			tagName: 'tr',
			className: 'service-item service-row'
		});

		super(options);

		({data: this.data} = options);

		this.bindListeners();
	}

	events() {
		return {
			'click .remove': 'onRemoveClicked',
			'change .column-qty input': 'onQtyChanged',
			'keyup .column-qty input': 'onQtyChanged',
			'change .price input': 'onPriceChanged',
			'keyup .price input': 'onPriceChanged',
			'click .minus': 'onMinusClicked',
			'click .plus': 'onPlusClicked'
		};
	}

	render() {
		let controlBtns, qtyBtns;
		const i18n = clientRegistry.getI18n();
		const modelJSON = this.model.toJSON();

		const attrs = {};
		if (this.data.isLocked) {
			attrs.disabled = 'disabled';
			qtyBtns = '';
			controlBtns = '';
		} else {
			qtyBtns = `\
<div class="btn-group btn-group-xs" role="group">
	<a href="#" class="btn btn-default minus">${bs.icon('minus')}</a>
	<a href="#" class="btn btn-default plus">${bs.icon('plus')}</a>
</div>\
`;

			controlBtns = `\
<a href="#" class="btn btn-default btn-sm remove">
	${bs.icon('trash')}
	${i18n.__('Remove')}
</a>\
`;
		}

		const qtyAttrs = _.extend({
			name: `service_qty[${this.model.id}]`
		}, attrs);

		const priceAttrs = _.extend({
			name: `service_price[${this.model.id}]`
		}, attrs);

		this.$el.html(`\
<td class="column-item">
	<input type="hidden" name="service_id[]" value="${this.model.id}" />
	${this.model.get('title')}
</td>
<td colspan="2" class="price">
	<div class="form-group">
		<div class="input-group">
			${bs.textField(modelJSON, 'price', priceAttrs)}
			<div class="input-group-text">${locale.getCurrencySymbol()}</div>
		</div>
	</div>
</td>
<td class="column-qty">
	<div class="form-group">
		${bs.textField(modelJSON, 'qty', qtyAttrs)}
	</div>
	${qtyBtns}
</td>
<td class="column-total"></td>
<td class="column-buttons">${controlBtns}</td>\
`
		);

		this.reCalcTotal();
		this.$el.data('id', this.model.id);

		return this;
	}

	onRemoveClicked(e) {
		e.preventDefault();

		return this.collection.remove(this.model);
	}

	onQtyChanged(e) {
		return this.model.set('qty', $(e.currentTarget).val());
	}

	onMinusClicked(e) {
		e.preventDefault();

		let newQty = (this.model.get('qty') * 1) - 1;
		if (newQty < 0) {
			newQty = 0;
		}

		return this.model.set('qty', newQty);
	}

	onPlusClicked(e) {
		e.preventDefault();

		return this.model.set('qty', ((this.model.get('qty') * 1) + 1));
	}

	onPriceChanged(e) {
		return this.model.set('price', $(e.currentTarget).val());
	}

	remove() {
		this.data = null;
		return super.remove(...arguments);
	}

	bindListeners() {
		this.listenTo(this.model, 'change:qty', () => {
			return this.reCalcTotal();
		});

		return this.listenTo(this.model, 'change:price', () => {
			return this.reCalcTotal();
		});
	}

	calcTotalPrice() {
		return this.model.set('total_price', moolah(this.model.get('price')).times(this.model.get('qty')).string());
	}

	reCalcTotal() {
		this.calcTotalPrice();

		this.$('.column-total').html(`\
${this.model.get('total_price')} ${locale.getCurrencySymbol()}\
`
		);

		return this.$('.column-qty input').val(this.model.get('qty'));
	}
}