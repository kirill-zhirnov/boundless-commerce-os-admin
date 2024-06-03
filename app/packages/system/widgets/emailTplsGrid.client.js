import GridWidget from '../../system/widgets/grid.client';

export default class EmailTplsGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('system/admin/emailTpls/collection');
		this.idAttribute = 'id';
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.commonFilter = {
			showRmStatus: false
		};
		this.commonButtons.buttons = [];

		this.columns = [
			{
				label: this.__('Title'),
				name: 'title',
			},
			{
				label: this.__('Alias'),
				name: 'alias',
			},
			{
				label: this.__('Subject'),
				name: 'subject',
			},
			{
				cell: 'buttons',
				buttons: [
					{type: 'edit'}
				]
			}
		];
	}

	getFileName() {
		return __filename;
	}
}