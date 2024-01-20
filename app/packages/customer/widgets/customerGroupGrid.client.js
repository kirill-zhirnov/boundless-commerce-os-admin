import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class CustomerGroupGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('customer/admin/group/collection');
		this.idAttribute = 'group_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Group Title'),
				name: 'title',
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = gHtml.tag('p', {class: 'mb-2'}, model.get('title'));
					out += gHtml.tag('p', {class: 'text-muted small'}, this.__('ID: %s', [model.get('group_id')]));

					return out;
				}
			},
			{
				label: this.__('Group Alias'),
				name: 'alias',
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