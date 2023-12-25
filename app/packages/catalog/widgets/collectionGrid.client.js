import GridWidget from '../../system/widgets/grid.client';
// import utils from '../../../modules/utils/common.client';

export default class Grid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('catalog/admin/collection/collection');
		this.idAttribute = 'collection_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Title'),
				name: 'title'
			},
			{
				label: this.__('Alias'),
				name: 'alias'
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'},
						// function(model) {
						// 	if (!model.get('alias')) {
						// 		const button = this.getDefaultsByType({type:'rm'});
						// 		return utils.buildAButtonByProps(button);
						// 	}
						// }
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					if (model.get('deleted_at') != null) {
						return 'removed';
					} else {
						return 'normal';
					}
				}
			}
		];

		this.bulkButtons = {
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