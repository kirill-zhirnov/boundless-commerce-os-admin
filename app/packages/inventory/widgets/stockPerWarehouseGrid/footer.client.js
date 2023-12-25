import Backgrid from '../../../../modules/grid/views/html/backgrid.client';
// import registry from '../../../../modules/registry/server/classes/instance';
import {clientRegistry} from '../../../../modules/registry/client/client.client';


const i18n = clientRegistry.getI18n();
const locale = clientRegistry.getLocale();

export default class Footer extends Backgrid.Footer {
	constructor(options) {
		if (options == null) {options = {};}
		super(options);

		// additionalData is null at init, so listen to collection sync
		this.collection = options.collection;
		({data: this.data} = options);

		this.bindListeners();
	}

	render() {
		this.$el.html(`
			<tr class="items-total info">
				<th class="title text-end">${i18n.__('Total:')}</th>
				<th class="price text-center">${locale.formatMoney('0')}</th>
				<th class="qty text-center">0</th>
				<th class="reserved text-center">0</th>
			</tr>
		`);
		return this;
	}

	bindListeners() {
		this.listenTo(this.collection, 'sync', function (model) {
			// reset fields if no warehouse selected
			if (model.queryParams.location_id === '') {
				return this.setFields({
					total_price: 0,
					total_qty: 0,
					total_reserved: 0
				});
			}

			if ((model.additionalData != null) && (model.additionalData.summary != null)) {
				return this.setFields(model.additionalData.summary);
			}
		});
	}

	setFields(summary) {
		this.$el.find('.price').text(locale.formatMoney(summary.total_price));
		this.$el.find('.qty').text(+summary.total_qty);
		this.$el.find('.reserved').text(+summary.total_reserved);
	}

	remove() {
		this.data = null;

		return super.remove();
	}
}