import StockPerWarehouseGrid from '../stockPerWarehouseGrid.client';

export default class StockPerWarehouseExport extends StockPerWarehouseGrid {
	initGrid() {
		this.export = ['excel'];
		this.idAttribute = 'item_id';
		return this.columns = [
			{
				label: this.__('Item ID'),
				name: 'item_id'
			},

			{
				label: this.__('Type'),
				name: 'type'
			},

			{
				label: this.__('Product ID'),
				name: 'product_id'
			},

			{
				label: this.__('Variant ID'),
				name: 'variant_id'
			},

			{
				label: this.__('Title'),
				cell: 'html',
				html(column, model) {
					let title = model.get('product')?.title || '';

					if (model.get('variant')?.title != null) {
						title = `${title}, ${model.get('variant')?.title}`;
					}

					return title;
				}
			},

			{
				label: this.__('Sku'),
				cell: 'html',
				html(column, model) {
					if (model.get('variant')?.sku) {
						return model.get('variant').sku;
					}

					return model.get('product')?.sku || '';
				}
			},

			{
				label: this.__('Product Type'),
				name: 'commodity_group_title',
				cell: 'html',
				html(column, model) {
					return model.get('commodity_group')?.title || '';
				}
			},

			{
				label: this.__('Price'),
				name: 'price'
			},

			{
				label: this.__('Available qty'),
				name: 'available_qty'
			},

			{
				label: this.__('Reserved qty'),
				name: 'reserved_qty'
			},
		];
	}
}