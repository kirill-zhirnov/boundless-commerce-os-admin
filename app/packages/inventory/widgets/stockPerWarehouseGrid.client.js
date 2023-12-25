import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';
import bs from '../../../modules/gHtml/bs.client';
import _ from 'underscore';
import {getImgCloudUrl} from '../../../modules/s3Storage/cloudUrl';

export default class StockPerWarehouseGrid extends GridWidget {
	constructor(options) {
		super(options);

		this.className = 'grid-widget stock-per-warehouse-grid';
	}

	initGrid() {
		this.collection = this.url('inventory/admin/stockPerWarehouse/collection');
		this.export = ['excel'];

		this.wrapperTpl = {
			type: 'widget',
			file: 'stockPerWarehouseGridWrapper',
			package: 'inventory'
		};

		this.idAttribute = 'item_id';
		this.columns = [
			{
				name: 'item',
				label: this.__('Product'),
				cell: 'html',
				clickable: false,
				html: (column, model) => {
					let skuHtml;
					if (!model) {
						return;
					}

					const image = model.get('image');
					const product = model.get('product');
					const variant = model.get('variant');
					const type = model.get('type');

					const classes = [];
					let img = '';
					if (image?.path) {
						classes.push('with-img');
						img = gHtml.img({src: getImgCloudUrl(image.path, 150)}, true);
					}

					const sku = variant?.sku || product.sku;
					if (sku) {
						skuHtml = `
							<p class="small text-muted">${this.__('SKU')}: ${sku}</p>
						`;
					}

					let title = product.title;
					if (type === 'variant') {
						title += ' ' + variant.title;
					}

					const link = gHtml.link(`#${model.get('product_id')}`, this.url('catalog/admin/product/form', {
						pk: model.get('product_id')
					}), {
						'data-skip-grid-action': '1'
					});

					let isVariant = '';
					if (type === 'variant') {
						isVariant = this.__('Variant');
					}

					return `
							<div class="${classes.join(' ')}">
								${img}
								<div class="text-wrapper">
									<p class="small">${title}</p>
									<p class="small text-muted">
										${this.__('ID')}: ${link} <i>${isVariant}</i>
									</p>
									${skuHtml}
								</div>
							</div>
						`;
				},

				filter: () => {
					const attrs = {
						placeholder: this.__('Title, SKU, ID'),
						class: 'form-control-sm'
					};

					return bs.textField(this.data.attrs, 'item', attrs);
				}
			},
			{
				label: this.__('Price'),
				customClass: 'text-center',
				cell: 'html',
				name: 'price',
				clickable: false,
				html: (column, model) => {
					if (!model) {
						return;
					}

					return this.getLocale().formatMoney(model.get('price'));
				},

				filter: () => {
					const attrs = {
						placeholder: this.__('8 or <8 or >8'),
						class: 'form-control-sm'
					};

					return bs.textField(this.data.attrs, 'price', attrs);
				}
			},
			{
				label: this.__('Available qty'),
				customClass: 'text-center',
				clickable: false,
				name: 'available_qty',
				filter: () => {
					const attrs = {
						placeholder: this.__('8 or <8 or >8'),
						class: 'form-control-sm'
					};

					return bs.textField(this.data.attrs, 'available_qty', attrs);
				}
			},
			{
				label: this.__('Reserved qty'),
				customClass: 'text-center',
				// filter: false,
				clickable: false,
				name: 'reserved_qty',
				filter: () => {
					const attrs = {
						placeholder: this.__('8 or <8 or >8'),
						class: 'form-control-sm'
					};

					return bs.textField(this.data.attrs, 'reserved_qty', attrs);
				}
			}
		];

		this.pageSize = {
			options: {
				100: 100,
				500: 500,
				all: this.__('Show all')
			},
			label: this.__('Show per page:')
		};

		this.commonButtons = null;
		this.commonFilter.showRmStatus = false;
	}


	prepareBackgridOptions(options) {
		options.emptyText = this.__('No items');
		options.data = _.extend({}, this.data);

		options.footer = require('./stockPerWarehouseGrid/footer.client').default;

		return options;
	}

	getFileName() {
		return __filename;
	}
}