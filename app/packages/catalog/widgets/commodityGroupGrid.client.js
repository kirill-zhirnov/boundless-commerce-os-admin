import GridWidget from '../../system/widgets/grid.client';
// import gHtmlActive from '../../../modules/gHtml/active.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class CommodityGroupGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-sm-10 offset-sm-1';
		this.collection = this.url('catalog/admin/commodityGroup/collection');
		this.idAttribute = 'group_id';
		this.formMode = 'page';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Title'),
				name: 'title',
				clickable: this.isClickable,
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					let out = gHtml.tag('p', {}, model.get('title'));
					if (model.get('not_track_inventory')) {
						out += gHtml.tag('p', {class: 'small text-muted'}, [gHtml.faIcon('ban'), this.__('Inventory management is disabled')].join(' '));
					} else {
						out += gHtml.tag('p', {class: 'small text-muted'}, [gHtml.faIcon('check-circle'), this.__('Inventory management is enabled')].join(' '));
					}

					if (model.get('physical_products')) {
						out += gHtml.tag('p', {class: 'small text-muted'}, [gHtml.faIcon('truck'), this.__('Physical products')].join(' '));
					}

					return out;
				}
			},
			{
				label: this.__('Is default?'),
				name: 'type',
				clickable: this.isClickable,
				filter: false,
				sortable: false,
				customClass: 'text-center',
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					if (model.get('is_default')) {
						return this.__('Yes');
					} else {
						return this.__('No');
					}
				}
			},
			// {
			// 	label: this.__('VAT'),
			// 	name: 'vat',
			// 	clickable: this.isClickable,
			// 	cell: 'html',
			// 	filter: false,
			// 	customClass: 'text-center',
			// 	sortable: false,
			// 	html: (column, model) => {
			// 		if (!model) {
			// 			return;
			// 		}
			//
			// 		return gHtmlActive.value(model.attributes, 'vat', this.data.options.vat);
			// 	}
			// },

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

	isClickable(model) {
		if (model.get('deleted_at') != null) {
			return false;
		} else {
			return true;
		}
	}
}