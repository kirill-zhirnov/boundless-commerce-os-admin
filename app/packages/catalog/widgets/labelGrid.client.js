import GridWidget from '../../system/widgets/grid.client';
import bs from '../../../modules/gHtml/bs.client';
import gHtml from '../../../modules/gHtml/index.client';
import ajax from '../../../modules/ajax/kit.client';

export default class LabelGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-10 offset-md-1';
		this.collection = this.url('catalog/admin/label/collection');
		this.idAttribute = 'label_id';

		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				name: 'label',
				label: this.__('Label'),
				cell: 'html',
				html: (column, model) => {
					const icon = gHtml.faIcon(model.get('icon'));
					const title = model.get('title');
					const bg = model.get('color');
					const txtColor = model.get('text_color');

					const tag = `
						<div style='color: ${txtColor}; background-color: ${bg}' class="product-tag">
							${icon}
							${title}
						</div>
					`;

					return tag;
				},

				filter: () => {
					const attrs =
						{placeholder: this.__('Title')};

					return `
						${bs.textField(this.data.attrs, 'title', attrs)}
					`;
				}
			},
			{
				name: 'removeAfter',
				label: this.__('Automatically remove from products'),
				cell: 'html',
				filter: false,
				sortable: false,
				customClass: 'text-center col-200',
				html: (column, model) => {
					if (!model) {
						return '';
					}

					let removeAfter = model.get('remove_after');
					if (removeAfter != null) {
						removeAfter = this.__('After') + ` ${removeAfter} ` + this.__('days');
					}

					return removeAfter || this.__('No');
				}
			},
			{
				cell: 'buttons',
				customClass: 'col-200',
				buttons: {
					normal: [
						{
							label: this.__('Remove from all products'),
							icon: 'fa fa-eraser',
							class: 'btn custom-btn custom-btn_outlined custom-btn_xs m-2',
							attrs: {
								'data-action': 'rmFromProducts'
							}
						},
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
				normal: [
					{type: 'rm'}
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
	}

	onActionRmFromProducts(model) {
		if (confirm(this.__('Are you sure?'))) {
			return ajax.get(this.url('catalog/admin/label/rmFromProducts', {labelId: model.get('label_id')}));
		}
	}

	getFileName() {
		return __filename;
	}
}