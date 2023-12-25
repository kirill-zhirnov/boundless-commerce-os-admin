import Widget from '../../../modules/widget/widget.client';
import ajax from '../../../modules/ajax/kit.client';
import Backbone from '../../../modules/backbone/index.client';
import _ from 'underscore';
import $ from 'jquery';

export default class CollectionProductsList extends Widget {
	constructor(options) {
		super(options);
		this.$sortableContainer = null;
		this.upTimer = null;

		_.defaults(this.data, {
			showCreate: false
		});
	}

	initialize() {
		// this.$sortableContainer = null;
		// this.upTimer = null;

		// return _.defaults(this.data, {
		// 	showCreate: false
		// });
	}

	attributes() {
		return {
			class: 'collection-products-list'
		};
	}

	events() {
		return {
			'collectionChanged.widget'(e, data) {
				this.data.pk = data.pk;

				return this.reRender();
			},

			'change .tick-box input': () => {
				return this.$('.rm-products').attr('disabled', !this.$('.tick-box input:checked').length);
			},

			'click .rm-products'(e) {
				e.preventDefault();

				const data = {
					pk: this.data.pk,
					product: []
				};

				this.$('.tick-box input:checked').each(function () {
					return data.product.push($(this).val());
				});

				return ajax.post($(e.currentTarget).data('url'), data)
					.then(() => {
						return this.reRender();
					});
			}
		};
	}

	runLazyInit() {
		this.collection = new Backbone.My.Collection();
		this.collection.url = () => {
			return this.url('catalog/collection/products', {id: this.data.pk});
		};

		return this.reRender();
	}

	reRender() {
		return this.collection.fetch({reset: true})
			.then(() => {
				return this.renderToWrapper('collectionProductsList', {
					collectionRow: this.collection.additionalData.collectionRow
				});
			})
			.then(() => {
				this.$sortableContainer = this.$('ul');
				return this.$sortableContainer.sortable({
					placeholder: 'sortable-placeholder',
					stop: () => {
						return this.saveSort();
					}
				});
			});
	}

	async saveSort() {
		const sort = [];
		this.$('.thumbnail').each((key, val) => {
			const $el = $(val);

			return sort.push($el.data('product'));
		});

		await ajax.post(this.url('catalog/admin/collection/saveProductSort'), {
			id: this.data.pk,
			sort
		});
		await this.triggerCollectionChanged();
	}

	triggerCollectionChanged() {
		if (this.upTimer) {
			clearTimeout(this.upTimer);
		}

		return this.upTimer = setTimeout(() => {
			return $(document).trigger('changed.products', [{
				id: this.data.pk
			}]);
		}
			, 200);
	}

	remove() {
		this.$sortableContainer.remove();

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}