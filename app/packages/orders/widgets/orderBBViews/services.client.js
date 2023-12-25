import Backbone from '../../../../modules/backbone/index.client';
import bs from '../../../../modules/gHtml/bs.client';
import ServiceItemView from './serviceItem.client';
import moolah from 'moolah';
import MyBackboneView from '../../../../modules/backbone/my/view.client';
import {clientRegistry} from '../../../../modules/registry/client/client.client';

export default class ServicesView extends MyBackboneView {
	constructor(options) {
		super(options);

		({data: this.data} = options);

		this.totalCollection = this.data.totalCollection;
		this.options = [];
		this.orderServiceCollection = null;
		this.orderServiceViews = {};
		this.$serviceSelect = null;

		this.setupCollections();
	}

	events() {
		const i18n = clientRegistry.getI18n();

		return {
			'click .add-service'(e) {
				e.preventDefault();

				this.clearSelectServiceError();

				const serviceId = this.$serviceSelect.val();

				if (serviceId === '') {
					this.showSelectServiceError(i18n.__('Please select service'));
					return;
				}

				if (this.orderServiceCollection.get(serviceId)) {
					this.showSelectServiceError(i18n.__('Service already added'));
					return;
				}

				const newModel = this.collection.get(serviceId).clone();
				newModel.set({
					qty : 1,
					total_price : newModel.get('price')
				});

				return this.orderServiceCollection.add(newModel);
			}
		};
	}

	render() {
		this.$delivery = this.$el.find('tr.delivery');
//		@collection - list of services, which may be added to order (drop down list)
//		@orderServiceCollection - list of services which were added to the order

		if ((this.collection.length > 0) || (this.orderServiceCollection.length > 0)) {
			this.renderSelectRow();

			this.orderServiceCollection.each(model => {
				return this.appendServiceItemView(model);
			});

			this.$serviceSelect = this.$('.service-select select');
		}

		return this;
	}

	appendServiceItemView(model) {
		const view = new ServiceItemView({
			collection : this.orderServiceCollection,
			model,
			data : this.data
		});

		const $lastRow = this.$('.service-row:last');

		if ($lastRow.length) {
			$lastRow.after(view.render().el);
		} else {
			this.$delivery.after(view.render().el);
		}

		return this.orderServiceViews[model.id] = view;
	}

	renderSelectRow() {
		const i18n = clientRegistry.getI18n();
		const emptyRow = {};
		const selectServiceOptions =
			{class : 'form-select-sm'};

		if (!this.data.isLocked) {
			return this.$delivery.after(`
				<tr class="service-row">
					<td colspan="6">
						<h5>
							${bs.icon('paperclip')}
							${i18n.__('Add additional services')}
						</h5>
						<div class="form-inline">
							<div class="form-group service-select">
								${bs.dropDownList(emptyRow, 'select_service', this.options, i18n, selectServiceOptions)}
							</div>
							<div class="form-group">
								<button type="button" class="btn btn-default btn-sm add-service">
									${bs.icon('plus')}
									${i18n.__('Add')}
								</button>
							</div>
						</div>
						<input type="hidden" name="service_price[__tmp]" value="" />
						<input type="hidden" name="service_qty[__tmp]" value="" />
					</td>
				</tr>
			`);
		}
	}

	setupCollections() {
		const Model = Backbone.My.Model.extend({
			idAttribute : 'service_id'
		});

		const Collection = Backbone.My.Collection.extend({
			model : Model
		});

		this.collection = new Collection(this.data.servicesList);

		this.options = [];
		this.collection.each(model => {
			return this.options.push([model.get('service_id'), model.get('title')]);
	});

		this.orderServiceCollection = new Collection(this.data.services);

		this.listenTo(this.orderServiceCollection, 'add', model => {
			this.appendServiceItemView(model);
			return this.calcServiceTotal();
		});

		this.listenTo(this.orderServiceCollection, 'remove', model => {
			this.orderServiceViews[model.id].remove();
			delete this.orderServiceViews[model.id];

			return this.calcServiceTotal();
		});

		this.listenTo(this.orderServiceCollection, 'change', () => {
			return this.calcServiceTotal();
		});

		return this.calcServiceTotal();
	}

	calcServiceTotal() {
		let qty = 0;
		let price = 0;

		this.orderServiceCollection.each(model => {
			price = moolah(price).plus(model.get('total_price')).float();
			return qty = moolah(qty).plus(model.get('qty')).float();
		});

		return this.totalCollection.get('services').set({
			qty,
			price
		});
	}

	showSelectServiceError(error) {
		const formWidget = this.$serviceSelect.parents('form:eq(0)').data('widget');

		return formWidget.showError(formWidget.$el, this.$serviceSelect, 'select_service', [error]);
	}

	clearSelectServiceError() {
		return clientRegistry.getTheme().clearFormErrors(this.$el, {service_select:this.$serviceSelect});
	}

	remove() {
		for (let id in this.orderServiceViews) {
			const view = this.orderServiceViews[id];
			view.remove();
		}

		return super.remove();
	}
}