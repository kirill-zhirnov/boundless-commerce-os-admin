import GridWidget from '../../system/widgets/grid.client';
import utils from '../../../modules/utils/common.client';
import adminBasket from '../../orders/modules/adminBasket.client';
import gHtml from '../../../modules/gHtml/index.client';
import bs from '../../../modules/gHtml/bs.client';
import modalKit from '../../../modules/modal/kit.client';
import ajax from '../../../modules/ajax/kit.client';
import _ from 'underscore';
import $ from 'jquery';

const faPrefix = 'fa fa-';
const btnSmallPurple = 'btn btn-purple btn-sm';

export default class ProductGrid extends GridWidget {
	constructor(options) {
		super(options);

		this.className = 'grid-widget product-grid';
	}

	async runLazyInit() {
		await super.runLazyInit();

		//init category filter
		this.setupCategoryFilter();
		this.collection.on('updated.extFilter', (data) => {
			let lastChanged = null;
			for (const [key, val] of Object.entries(data)) {
				if (!(key in this.collection.queryParams) || String(this.collection.queryParams[key]) != String(val)) {
					lastChanged = this.$(`[name=${key}]`).val(val);
				}
			}

			if (lastChanged) {
				lastChanged.trigger('change');
			}
		});
	}

	initGrid() {
		this.collection = this.url('catalog/admin/product/collection');
		this.idAttribute = 'product_id';
		this.formMode = 'page';
		this.export = ['excel'];
		this.wrapperTpl = {
			type: 'widget',
			file: 'productGridWrapper',
			package: 'catalog'
		};

		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				name: 'product',
				label: this.__('Product'),
				clickable: false,
				cell: 'html',
				html: (column, model) => {
					let title;
					const classes = [];
					let img = '';
					if (model.get('thumb') && model.get('thumb').s) {
						classes.push('with-img');
						img = gHtml.img(model.get('thumb').s, true);
					}

					let sku = '';
					if (model.get('sku')) {
						sku = `, ${this.__('SKU')}: ${model.get('sku')}`;
					}

					let additional = '';
					if (model.get('manufacturer_title')) {
						additional += `<p class="small text-muted">${this.__('Manufacturer')}: ${model.get('manufacturer_title')}</p>`;
					}

					if (model.get('commodity_group_title')) {
						additional += `<p class="small text-muted">${this.__('Product Type')}: ${model.get('commodity_group_title')}</p>`;
					}

					if (model.get('collections')) {
						additional += `<p class="small text-muted">${this.__('Collections')}: ${_.pluck(model.get('collections'), 'title').join(', ')}</p>`;
					}

					let status = '';
					if (model.get('status') === 'hidden') {
						status = gHtml.faIcon('eye-slash');
						classes.push('is-hidden');
					}

					if (model.get('title')) {
						title = gHtml.tag('p', {class: 'title'}, `${status}${model.get('title')}`);
					} else {
						title = gHtml.tag('p', {class: 'text-muted'}, `<i>${this.__('No name')}</i>`);
					}

					const labels = model.get('labels');

					let labelItems = '';
					for (let label of Array.from(labels)) {
						labelItems += `\
<li>
	<div class="product-tag" style="color: ${label.text_color};background-color: ${label.color}">
		${bs.icon(label.icon)} ${label.title}
	</div>
</li>\
`;
					}

					const labelList = `<ul class="pull-right product-tag-list">${labelItems}</ul>`;

					const pk = model.get('product_id');
					const out = `\
<div class="${classes.join(' ')}">
	${img}
	<div class="text-wrapper">
		${labelList}
		${title}
		<p class="small text-muted">${this.__('ID')}: ${pk}${sku}</p>
		${additional}
	</div>
</div>\
`;

					return this.wrapInLink(out, model);
				},

				filter: () => {
					return bs.textField(this.data.attrs, 'product', {
						placeholder: this.__('Title, SKU, ID or description (min 3 symbols)')
					});
				}
			},
			{
				name: 'price',
				label: this.__('Price'),
				clickable: false,
				cell: 'html',
				customClass: 'text-center',
				html: (column, model) => {
					const curPrice = this.formatPrice(model.get('price'), 'price-current');
					let oldPrice = this.formatPrice(model.get('price_old'), 'price-old');

					if (model.get('has_variants')) {
						oldPrice += gHtml.tag('p', {class: 'small text-muted'}, this.__('has variants'));
					}

					return this.wrapInLink(`${curPrice}${oldPrice}`, model);
				},

				filter: () => {
					return bs.textField(this.data.attrs, 'price', {
						placeholder: this.__('8 or <8 or >8')
					});
				}
			},
			{
				name: 'stock',
				label: this.__('Stock'),
				clickable: this.isClickable,
				cell: 'html',
				html: (column, model) => {
					let stock;
					const classes = ['badge'];
					if (model.get('available_qty') > 0) {
						classes.push('bg-success');
					} else {
						classes.push('bg-secondary');
					}

					if (model.get('trackInventory')) {
						stock = `
							<p class="text-center">
								<span class="${classes.join(' ')}">${model.get('available_qty')}</span>
							</p>
						`;
						if (model.get('reserved_qty') > 0) {
							stock += gHtml.tag('p', {class: 'text-muted small'}, `${this.__('Reserved')}: ${model.get('reserved_qty')}`);
						}
					} else {
						stock = `
							<p class="text-center">
								<span class="${classes.join(' ')}">${model.get('available_qty') > 0 ? this.__('In stock') : this.__('Out of stock')}</span>
							</p>`;
					}

					return this.wrapInLink(stock, model);
				},

				filter: () => {
					return bs.dropDownList(this.data.attrs, 'stock', this.data.options.stock);
				}
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						_.bind(this.addToBasketBtn, this),
						{type: 'rm'}
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					if (model.get('deleted_at') != null) {
						return 'removed';
					} else {
						return 'normal';
					}
				}
			}
		];

		this.bulkButtons = {
			showTitle: false,
			buttons: {
				//@ts-ignore
				normal: [
					[
						{
							icon: `${faPrefix}eye`,
							class: btnSmallPurple,
							attrs: {
								'data-action': 'publish',
								'data-publish': '1',
								title: this.__('Publish selected')
							}
						},
						{
							icon: `${faPrefix}eye-slash`,
							class: btnSmallPurple,
							attrs: {
								'data-action': 'publish',
								'data-publish': '0',
								title: this.__('Hide selected from the site')
							}
						},
					],
					{
						icon: `${faPrefix}folder-open`,
						label: this.__('Categories'),
						class: btnSmallPurple,
						attrs: {
							'data-action': 'category'
						}
					},
					{
						label: this.__('Collections'),
						icon: `${faPrefix}star`,
						class: btnSmallPurple,
						attrs: {
							'data-action': 'collectionsDialog'
						}
					},
					{
						label: this.__('Duplicate'),
						icon: `${faPrefix}files-o`,
						class: btnSmallPurple,
						attrs: {
							'data-action': 'duplicate'
						}
					},
					{
						label: this.__('Set prices'),
						icon: `${faPrefix}usd`,
						class: btnSmallPurple,
						attrs: {
							'data-action': 'setPrices'
						}
					},
					{
						label: this.__('Set stock'),
						icon: `${faPrefix}battery-quarter`,
						class: btnSmallPurple,
						attrs: {
							'data-action': 'setStock'
						}
					},
					{
						type: 'raw',
						html: this.getCrossSellBulkBtn()
					},
					{
						label: this.__('Archive'),
						icon: `${faPrefix}trash`,
						class: btnSmallPurple,
						attrs: {
							'data-action': 'rm'
						}
					},
				],
				removed: [
					{type: 'restore'}
				]
			},

			scope: () => {
				const models = this.htmlView.getCheckedModels(true);
				if (models[0] && (models[0].get('deleted_at') != null)) {
					return 'removed';
				}

				return 'normal';
			}
		};

		this.commonButtons = {
			buttons: [
				{type: 'add'},
				//@ts-ignore
				{
					label: this.__('Import'),
					icon: `${faPrefix}cloud-upload`,
					class: 'btn btn-outline-purple btn-sm m-1',
					attrs: {
						href: this.url('catalog/admin/import/index')
					}
				}
			]
		};
	}

	events() {
		return _.extend(super.events(), {
			'click .filter .toggle-row'(e) {
				e.preventDefault();

				const $second = this.$('.filter .second-row');
				const $filter = this.$('.filter');
				if ($second.is(':visible')) {
					$filter.removeClass('second-opened');
					$second.slideUp();
				} else {
					$filter.addClass('second-opened');
					$second.slideDown();
				}
			},

			'input input[name="rmStatus"]'(e) {
				const $clearRm = this.$('.clear-rm');

				if ($(e.currentTarget).is(':checked')) {
					return $clearRm.show();
				} else {
					return $clearRm.hide();
				}
			},

			'click a.clear-rm'(e) {
				e.preventDefault();

				if (!confirm(this.__('Are you sure?'))) {
					return;
				}

				ajax.post($(e.target).attr('href'));
			}
		});
	}

	wrapInLink(content, model) {
		const attrs = {};
		if (!model.get('deleted_at')) {
			attrs.href = this.url('catalog/admin/product/form', {
				pk: model.get('product_id'),
				grid: this.collection.serializeStates()
			});
		}

		return gHtml.tag('a', attrs, content);
	}

	isClickable(model) {
		if (model.get('deleted_at') != null) {
			return false;
		} else {
			return true;
		}
	}

//		return utils.buildAButtonByProps {
//			label : @__('Preview')
//			icon : 'glyphicon glyphicon-eye-open'
//			class : 'btn btn-default btn-sm'
//			attrs :
//				target : '_blank'
//				href : model.get('url')
//		}

	createHtmlView() {
		const GridHtmlView = require('../../../modules/grid/views/html.client').default;
		this.htmlView = new GridHtmlView({
			gridWidget: this,
			el: this.el,
			$gridWrapper: this.$('.grid-block')
		});
		this.htmlView.render();
	}

	addToBasketBtn(model) {
		// if (model.get('price')) {
		return utils.buildAButtonByProps({
			label: this.__('To cart'),
			icon: `${faPrefix}shopping-cart`,
			class: 'btn custom-btn custom-btn_outlined custom-btn_xs m-2',
			attrs: {
				'data-action': 'toBasket'
			}
		});
		// }
		//
		// return '';
	}

	onBulkActionCollectionsDialog(models) {
		modalKit.createRemote(['catalog/admin/collection/chooseCollection', {
			products: this.getPkByModels(models)
		}]);
	}

	onBulkActionCategory(models) {
		modalKit.createRemote(['catalog/admin/product/bulk/category', {
			pk: this.getPkByModels(models)
		}]);
	}

	onBulkActionPublish(models, $btn) {
		ajax.post(['catalog/admin/product/bulk/status'], {
			pk: this.getPkByModels(models),
			publish: $btn.data('publish')
		});
	}

	onBulkActionDuplicate(models) {
		ajax.get(['catalog/admin/product/bulk/copy', {
			pk: this.getPkByModels(models)
		}]);
	}

	onBulkActionSetPrices(models) {
		modalKit.createRemote(['catalog/admin/product/bulk/setPrices', {
			pk: this.getPkByModels(models)
		}]);
	}

	onBulkActionSetStock(models) {
		modalKit.createRemote(['catalog/admin/product/bulk/setStock', {
			pk: this.getPkByModels(models)
		}]);
	}

	onBulkActionAddCross(models, $el) {
		modalKit.createRemote(['catalog/admin/product/crossSell/add', {
			category: $el.data('category'),
			product: this.getPkByModels(models)
		}]);
	}

	onBulkActionClearCross(models, $el) {
		if (!confirm(this.__('Are you sure?'))) {
			return;
		}

		ajax.post(['catalog/admin/product/crossSell/rmAll'], {
			category: $el.data('category'),
			product: this.getPkByModels(models)
		});
	}

	setupCategoryFilter() {
		const CategoryFilter = require('../../catalog/vue/admin/product/grid/CategoryFilter.vue').default;
		this.makeVue({
			render: (h) => h(CategoryFilter, {
				props: {
					collection: this.collection
				}
			})
		}).$mount(this.$('.category-filter-app').get(0));
	}

	getPkByModels(models) {
		return this.getIdByModels(models, 'product_id');
	}

	onActionToBasket(model, $btn) {
		return adminBasket.addProduct(model.get('product_id'));
	}

	formatPrice(price, cssClass) {
		if (!price) {
			return '';
		}

		let content = '';
		if (Array.isArray(price)) {
			content = this.__('From: %s', [this.getLocale().formatMoney(price[0])]);
		} else {
			content = this.getLocale().formatMoney(price);
		}

		return gHtml.tag('p', {class: cssClass}, content);
	}

	getCrossSellBulkBtn() {
		let content = gHtml.link(
			`${gHtml.faIcon('line-chart')} ${this.__('Cross sell')} ${gHtml.faIcon('caret-up')}`,
			'#',
			{
				class: `${btnSmallPurple} dropdown-toggle`,
				'data-bs-toggle': 'dropdown'
			}
		);

		content += '<ul class="dropdown-menu">';
		content += [
			{
				icon: 'plus-circle',
				title: this.__('Add related products'),
				action: 'addCross',
				category: 'related'
			},
			{
				icon: 'eraser',
				title: this.__('Clear related products'),
				action: 'clearCross',
				category: 'related'
			},
			{
				icon: 'plus-circle',
				title: this.__('Add similar products'),
				action: 'addCross',
				category: 'similar'
			},
			{
				icon: 'eraser',
				title: this.__('Clear similar products'),
				action: 'clearCross',
				category: 'similar'
			},
		].map(row =>
			gHtml.tag(
				'li',
				{},
				gHtml.link(`${gHtml.faIcon(row.icon)} ${row.title}`, '#', {
					'class': 'dropdown-item',
					'data-action': row.action,
					'data-category': row.category
				})
			)
		).join('');

		content += '</ul>';

		return gHtml.tag('div', {class: 'dropdown'}, content);
	}

	onExportClicked(e) {
		e.preventDefault();

		modalKit.createRemote(['catalog/admin/product/export/form', {
			grid: this.collection.serializeStates(),
			export: $(e.currentTarget).data('export')
		}]);
	}

	getFileName() {
		return __filename;
	}
}