import ChangeQtyGrid from '../changeQtyGrid.client';

export default class ChangeQtyExport extends ChangeQtyGrid {
	initGrid() {
		this.export = ['excel'];
		this.idAttribute = 'item_id';
		this.columns = [
			{
				label: 'ID',
				name: 'item_id'
			},

			{
				label: this.__('Date'),
				name: 'date_time',
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
				name: 'title'
			},

			{
				label: this.__('Sku'),
				name: 'sku'
			},

			{
				label: this.__('Reason'),
				name: 'reason_title'
			},

			{
				label: this.__('User'),
				name: 'person'
			},

			{
				label: this.__('Person email'),
				name: 'email'
			},

			{
				label: this.__('Order'),
				name: 'order_id'
			},

			{
				label: this.__('From warehouse'),
				name: 'from_warehouse_title'
			},

			{
				label: this.__('To warehouse'),
				name: 'to_warehouse_title'
			},

			{
				label: this.__('Available qty change'),
				name: 'available_qty_diff'
			},

			{
				label: this.__('Reserved qty change'),
				name: 'reserved_qty_diff'
			}
		];
	}
}