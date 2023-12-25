import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class FeedsGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('catalog/admin/feeds/collection');
		this.idAttribute = 'feed_id';
		this.cssGridWrapper = 'col-md-10 offset-md-1';
		this.formMode = 'page';

		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Title'),
				name: 'title'
			},
			{
				label: this.__('Type'),
				name: 'type',
				cell: 'html',
				filter: {
					type: 'select',
					options: this.data.options.types,
				},
				html: (column, model) => {
					switch (model?.get('type')) {
						case 'google-shopping':
							return this.__('Google shopping');
						case 'facebook':
							return this.__('Facebook');
						default:
							return null;
					}
				},
				customClass: 'col-150 text-center'
			},
			{
				label: this.__('Url'),
				clickable: false,
				filter: false,
				sortable: false,
				cell: 'html',
				html: (column, model) => {
					if (!model)
						return;

					let url = '';
					if (model.get('type') == 'google-shopping') {
						url = this.url('catalog/feed/google', {id: model.get('feed_id')}, true);
					}

					return gHtml.textField('', url, {class: 'form-control', readonly: '1'});
				}
			},
			{
				label: this.__('Is protected?'),
				clickable: false,
				filter: false,
				sortable: false,
				cell: 'html',
				html: (column, model) => {
					if (!model)
						return null;
					const protection = model.get('is_protected');
					if (!protection) return this.__('No');
					return `
						${this.__('Yes')}<br/>
						${this.__('Username')}: ${protection.login}<br/>
						${this.__('Password')}: ${protection.pass}
					`;
				},
				customClass: 'col-200'
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'},
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
	}

	getFileName() {
		return __filename;
	}
}