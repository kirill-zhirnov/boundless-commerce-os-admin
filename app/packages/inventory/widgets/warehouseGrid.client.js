import GridWidget from '../../system/widgets/grid.client';

export default class WarehouseGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('inventory/admin/warehouse/collection');
		this.idAttribute = 'warehouse_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Title'),
				name: 'title'
			},
			{
				label: this.__('Address'),
				name: 'address'
			},
			{
				label: this.__('Sort'),
				name: 'sort',
				filter: false,
				customClass: 'col-80 text-center'
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
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

		return this.bulkButtons = {
			buttons: {
				//@ts-ignore
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

	getFileName() {
		return __filename;
	}
}