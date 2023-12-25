import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class TokenGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('system/admin/webhook/collection');
		this.idAttribute = 'webhook_id';
		this.cssGridWrapper = 'col-md-10 offset-md-1';
		this.commonFilter =
			{showRmStatus: false};

		this.columns = [
			{
				label: this.__('Name'),
				name: 'name',
			},
			{
				label: this.__('Request URL'),
				sortable: false,
				clickable: false,
				cell: 'html',
				name: 'url',
				html: (column, model) => {
					if (!model) return;

					return gHtml.textField('', model.get('url'), {class: 'form-control', readonly: 'readonly'});
				}
			},
			{
				cell: 'buttons',
				buttons: [
					{
						type: 'rm',
						label: this.__('Delete')
					}
				]
			}
		];

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Create new webhook')
				},
			]
		};
	}

	getFileName() {
		return __filename;
	}
}