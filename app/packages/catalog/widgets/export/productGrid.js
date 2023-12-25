import ProductGrid from '../productGrid.client';

export default class ProductExport extends ProductGrid {
	initGrid() {
		super.initGrid();

		return this.columns = [
			{
				name: 'title',
				label: this.__('Title')
			},

			{
				name: 'sku',
				label: this.__('SKU')
			},

			{
				label: this.__('Min price'),
				name: 'min_price',
				cell: 'html',
				html(column, model) {
					if (model.get('has_variants')) {
						if (model.get('price_min') != null) {
							return `${model.get('price_min')}`;
						}
					}

					return model.get('price');
				}
			},

			{
				label: this.__('Max price'),
				name: 'max_price',
				cell: 'html',
				html(column, model) {
					if (model.get('has_variants')) {
						if (model.get('price_max') != null) {
							return `${model.get('price_max')}`;
						}
					}

					return model.get('price');
				}
			},

			{
				label: this.__('Compare-at price (min)'),
				name: 'old_min_price',
				cell: 'html',
				html(column, model) {
					if (model.get('has_variants')) {
						if (model.get('price_old_min') != null) {
							return `${model.get('price_old_min')}`;
						}
					}

					return model.get('price_old');
				}
			},

			{
				label: this.__('Compare-at price (max)'),
				name: 'old_max_price',
				cell: 'html',
				html(column, model) {
					if (model.get('has_variants')) {
						if (model.get('price_old_max') != null) {
							return `${model.get('price_old_max')}`;
						}
					}

					return model.get('price_old');
				}
			},

			{
				label: this.__('Stock'),
				name: 'available_qty',
				cell: 'html',
				html(column, model) {
					if (model.get('product_not_track_inventory')) {
						return '';
					} else {
						return model.get('available_qty');
					}
				}
			},

			{
				label: this.__('Reserved'),
				name: 'reserved_qty',
				cell: 'html',
				html(column, model) {
					if (model.get('product_not_track_inventory')) {
						return '';
					} else {
						return model.get('reserved_qty');
					}
				}
			},

			{
				label: this.__('Manufacturer'),
				name: 'manufacturer_title'
			},

			{
				label: this.__('Product Type'),
				name: 'commodity_group_title'
			},

			{
				label: this.__('Variants'),
				name: 'has_variants',
				cell: 'html',
				html(column, model) {
					if (model.get('has_variants')) {
						return this.__('Yes');
					} else {
						return this.__('No');
					}
				}
			},

			{
				label: this.__('Description'),
				name: 'description',
				stripTags: () => {
					if (this.data.attrs.descriptionAsHtml === '1') {
						return false;
					} else {
						return true;
					}
				}
			},

			{
				label: this.__('Image url'),
				name: 'img_url',
				cell: 'html',
				html(column, model) {
					const thumb = model.get('thumb');
					if (thumb && ((thumb.l != null ? thumb.l.src : undefined) != null)) {
						return thumb.l.src;
					}

					return '';
				}
			},

			{
				label: this.__('Url key'),
				name: 'url_key',
			},

			{
				name: 'product_id',
				label: 'Product ID'
			},
		];
	}
}