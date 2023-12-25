import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class OrderStatusGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('orders/admin/setup/orderStatus/collection');
		this.idAttribute = 'status_id';
		this.cssGridWrapper = 'col-md-10 offset-md-1';

		this.columns = [
			{
				label: this.__('Status title'),
				name: 'title',
				cell: 'html',
				sortable: false,
				filter: false,
				html: (column, model, $td) => {
					$td.css('background-color', `#${model.get('background_color')}`);
					return model.get('title');
				}
			},
			{
				label: this.__('Stock status'),
				name: 'stock_location',
				sortable: false,
				filter: false,
				cell: 'html',
				html: (column, model, $td) => {
					let title, comment;
					switch (model.get('stock_location')) {
						case 'inside':
							title = this.__('Reserved');
							comment = this.__('Items are located in a warehouse and reserved for an order.');
							break;
						case 'outside':
							title = this.__('Shipped');
							comment = this.__('Items are shipped.');
							break;
						case 'basket':
							title = this.__('Not reserved');
							break;
					}

					let out = gHtml.tag('p', {}, title);
					if (comment) {
						out += gHtml.tag('div', {class: 'text-muted small'}, comment);
					}

					return out;
				}
			},
			{
				label: this.__('Sort'),
				name: 'sort',
				filter: false,
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'},
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					return model.get('deleted_at') !== null ? 'removed' : 'normal';
				}
			}
		];

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Create new order status')
				}
			]
		};
	}

	getFileName() {
		return __filename;
	}
}