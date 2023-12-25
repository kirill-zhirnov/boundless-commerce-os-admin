import ProductGrid from '../productGrid.client';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class ProductItemGrid extends ProductGrid {
	initGrid() {
		this.columns = [
			{
				name: 'title',
				label: this.__('Title'),
				cell: 'html',
				html: (column, model) => {
					let title = model.get('product').title;

					if (model.get('type') == 'variant') {
						title += ', ' + model.get('variant').title;
					}

					return title;
				}
			},
			{
				name: 'type',
				label: this.__('Type'),
				html: (column, model) => {
					switch (model.get('type')) {
						case 'variant':
							return this.__('Variant');

						case 'product':
							return this.__('Product');
					}
				}
			},
			{
				name: 'sku',
				label: this.__('SKU'),
				cell: 'html',
				html: (column, model) => {
					return model.get('type') == 'variant' ? model.get('variant').sku : model.get('product').sku;
				}
			},

			{
				label: this.__('Reserved'),
				name: 'reserved_qty',
				cell: 'html',
				html: (column, model) => {
					return model.get('track_inventory') ? model.get('reserved_qty') : '';
				}
			},

			{
				label: this.__('Manufacturer'),
				name: 'manufacturer_title'
			},

			{
				label: this.__('Product Type'),
				cell: 'html',
				html: (column, model) => {
					return model.get('commodity_group')?.title || '';
				}
			},

			{
				label: this.__('Country of origin'),
				name: 'country_of_origin_title',
			},

			{
				label: this.__('Category'),
				name: 'default_category_title',
			},

			{
				label: this.__('Product title'),
				cell: 'html',
				html: (column, model) => {
					return model.get('product')?.title || '';
				}
			},

			{
				label: this.__('Variant title'),
				cell: 'html',
				html: (column, model) => {
					return model.get('variant')?.title || '';
				}
			},

			{
				label: this.__('Product description'),
				name: 'product_description',
				stripTags: () => {
					return (this.data.attrs.descriptionAsHtml == '1') ? false : true;
				}
			},
			{
				label: this.__('Image url'),
				cell: 'html',
				html: (column, model) => {
					if (!model.get('image') || !model.get('image').path) return '';

					const thumb = thumbnailUrl.getAttrs(this.getInstanceRegistry(), model.get('image'), 'scaled', 'l');
					return thumb.src || '';
				}
			},
			{
				label: this.__('Url key'),
				name: 'url_key',
				cell: 'html',
				html: (column, model) => {
					return model.get('product')?.url_key || '';
				}
			},
			{
				label: this.__('Item ID'),
				name: 'item_id',
			},
			{
				label: this.__('Product ID'),
				name: 'product_id',
			}
		];

		const reservedIndex = this.columns.findIndex((row) => row.name == 'reserved_qty');

		//stock columns
		const stockColumns = [reservedIndex, 0];
		this.data.locations.forEach((location) => {
			//@ts-ignore
			stockColumns.push({
				name: `stock_location_${location.location_id}`,
				label: this.__('Stock at "%s"', [location.title]),
				cell: 'html',
				html: (column, model) => {
					if (model.get('track_inventory')) {
						let stock = model.get('stock');

						if (location.location_id in stock)
							return stock[location.location_id];

						return 0;
					}
				}
			});
		});

		this.columns.splice.apply(this.columns, stockColumns);

		let priceColumns = [(reservedIndex + this.data.locations.length + 1), 0];
		this.data.prices.forEach((price) => {
			priceColumns.push({
				name: `price_${price.price_id}`,
				label: price.title,
				cell: 'html',
				html: (column, model) => {
					const prices = model.get('prices');

					const priceValue = prices.find(el => el.price_id = price.price_id);
					if (priceValue)
						return priceValue.value;
				}
			});

			if (price.has_old_price) {
				priceColumns.push({
					name: `price_${price.price_id}_old`,
					label: `${this.__('Compare-at price')} (${price.title})`,
					cell: 'html',
					html: (column, model) => {
						const prices = model.get('prices');

						const priceValue = prices.find(el => el.price_id = price.price_id);
						if (priceValue)
							return priceValue.old;
					}
				});
			}
		});

		this.columns.splice.apply(this.columns, priceColumns);
	}
}