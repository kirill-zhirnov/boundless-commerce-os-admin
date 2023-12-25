import GridWidget from '../../system/widgets/grid.client';
// import utils from '../../../modules/utils/common.client';
import gHtml from '../../../modules/gHtml/index.client';
// import _ from 'underscore';

export default class ManufacturerGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.collection = this.url('catalog/admin/manufacturer/collection');
		this.idAttribute = 'manufacturer_id';
		this.export = ['excel'];
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.getI18n().__('Title'),
				name: 'title',
				clickable: this.isClickable,
				cell: 'html',
				html(column, model) {
					const classes = [];
					let img = '';
					if (model.get('smallThumb')) {
						classes.push('with-img clearfix');
						img = gHtml.img(model.get('smallThumb'));
					}

					const out = `
						<div class="${classes.join(' ')}">
							${img}
							<div class="text-wrapper">
								<p>${model.get('title')}</p>
							</div>
						</div>
					`;

					return out;
				}
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						// _.bind(this.previewBtn, this),
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

	// previewBtn(model) {
	// 	return utils.buildAButtonByProps({
	// 		label: this.getI18n().__('View'),
	// 		icon: 'glyphicon glyphicon-new-window',
	// 		class: 'btn btn-default btn-sm',
	// 		attrs: {
	// 			target: '_blank',
	// 			href: model.get('url')
	// 		}
	// 	});
	// }

	isClickable(model) {
		if (model.get('deleted_at') != null) {return false;} else {return true;}
	}

	getFileName() {
		return __filename;
	}

	//@ts-ignore
	className() {
		return 'grid-widget manufacturer-grid';
	}
}