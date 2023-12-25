import GridWidget from '../../system/widgets/grid.client';

export default class FilterGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('catalog/admin/filter/collection');
		this.idAttribute = 'filter_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},

			{
				label: this.__('Title'),
				name: 'title'
			},
			{
				label: this.__('Is default?'),
				name: 'is_default',
				cell: 'html',
				sortable: false,
				filter: {
					type: 'select',
					options: this.data.options.isDefault
				},
				html: (column, model) => {
					if (model.get('is_default')) {
						return this.__('Yes');
					} else {
						return this.__('No');
					}
				},
				customClass: 'col-100 text-center'
			},
			{
				cell: 'buttons',
				buttons: [
					{type: 'edit'},
					{
						label: this.__('Delete'),
						type: 'rm'
					}
				],
			}
		];

		this.commonFilter.showRmStatus = false;

		this.bulkButtons = {
			buttons: {
				//@ts-ignore
				normal: [
					{type: 'rm'}
				]
			},
			//				removed: [
			//					{type: 'restore'}
			//				]

			scope: () => {
				return 'normal';
			}
		};

		this.formMode = 'page';

		this.commonButtons = {
			buttons: [
				{type: 'add', label: 'Create filter set'}
			]
		};
	}

	getFileName() {
		return __filename;
	}
}