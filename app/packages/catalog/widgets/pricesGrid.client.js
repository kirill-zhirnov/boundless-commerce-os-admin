import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class PricesGrid extends GridWidget {
	initGrid() {
		// this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('catalog/admin/prices/collection');
		this.idAttribute = 'price_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Price Title'),
				name: 'title',
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = gHtml.tag('p', {class: 'mb-2'}, model.get('title'));
					out += gHtml.tag('p', {class: 'text-muted small'}, this.__('ID: %s', [model.get('price_id')]));

					return out;
				}
			},
			{
				label: this.__('Price Alias'),
				sortable: false,
				name: 'alias',
				customClass: 'text-center'
			},
			{
				label: this.__('Is Public?'),
				name: 'is_public',
				sortable: false,
				cell: 'html',
				filter: {
					type: 'select',
					options: this.data.options.isPublic
				},
				html: (column, model) => {
					if (!model) {
						return;
					}

					const classes = model.get('is_public') ? 'text-primary' : 'text-warning';
					return gHtml.tag(
						'span',
						{class: classes},
						model.get('is_public') ? this.__('Public') : this.__('Private')
					);
				},
				customClass: 'text-center'
			},
			{
				label: this.__('Groups'),
				name: 'group_id',
				// name: 'address',
				clickable: this.isClickable,
				cell: 'html',
				customClass: 'text-center',
				sortable: false,
				filter: {
					type: 'select',
					options: this.data.options.groups
				},
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = '';
					if (Array.isArray(model.get('groups'))) {
						out = model.get('groups').join('<br/>');
					}

					return out;
				}
			},
			{
				label: this.__('Sort'),
				name: 'sort',
				filter: false,
				customClass: 'text-center'
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'}
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					if (model.get('deleted_at') != null) {return 'removed';} else {return 'normal';}
				}
			}
		];

		this.bulkButtons = {
			buttons: {
				normal: [{type: 'rm'}],
				removed: [{type: 'restore'}]
			},

			scope: () => {
				const models = this.htmlView.getCheckedModels(true);
				if (models[0] && (models[0].get('deleted_at') != null)) {
					return 'removed';
				}

				return 'normal';
			}
		};
	}

	getFileName() {
		return __filename;
	}
}